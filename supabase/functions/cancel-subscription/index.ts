import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import Stripe from "npm:stripe"
import { sendEmail, getEmailTemplate } from "../_shared/email.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) return createResponse(null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401)

    // Parse body for cancellation reason
    const { reason = 'Cancelamento solicitado pelo usuário.' } = await req.json()

    const supabase = getSupabaseClient(req)
    const supabaseService = getServiceClient()

    // 2. Fetch active user subscription
    const { data: userSub, error: subError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subError || !userSub) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Nenhuma assinatura ativa encontrada para este usuário.' }, 404)
    }

    // 3. Fetch Stripe config
    const { data: setting, error: settingError } = await supabaseService
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'stripe_config')
      .single()

    if (settingError || !setting) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Stripe configuration not found in settings' }, 404)
    }

    const config = setting.value_json as any
    const mode = config.mode || 'sandbox'
    const secretKey = mode === 'production' ? config.production_secret_key : config.sandbox_secret_key

    if (!secretKey) {
      return createResponse(null, { code: 'BAD_REQUEST', message: `Stripe secret key is missing for mode ${mode}.` }, 400)
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    })

    const subscriptionId = userSub.stripe_subscription_id
    let refunded = false
    let refundErrorLog = null

    // Check if the cancellation request is within the 7-day refund window
    const createdAtTime = new Date(userSub.created_at).getTime()
    const nowTime = Date.now()
    const diffDays = (nowTime - createdAtTime) / (1000 * 60 * 60 * 24)
    const eligibleForRefund = diffDays <= 7 && subscriptionId && subscriptionId !== 'direct_payment'

    // 4. Cancel in Stripe and refund if eligible
    if (subscriptionId && subscriptionId !== 'direct_payment') {
      try {
        // Cancel subscription in Stripe immediately
        await stripe.subscriptions.cancel(subscriptionId)

        // Process refund if within the 7-day window
        if (eligibleForRefund) {
          try {
            const invoices = await stripe.invoices.list({
              subscription: subscriptionId,
              limit: 1,
            })

            if (invoices.data.length > 0 && invoices.data[0].charge) {
              const chargeId = invoices.data[0].charge as string
              
              await stripe.refunds.create({
                charge: chargeId,
                reason: 'requested_by_customer'
              })
              refunded = true
            }
          } catch (refErr: any) {
            console.error('Stripe Refund API error:', refErr.message)
            refundErrorLog = refErr.message
          }
        }
      } catch (stripeErr: any) {
        console.error('Stripe Subscription Cancel API error:', stripeErr.message)
        // If the subscription is already canceled in Stripe but not in our DB, we proceed to update locally
        if (!stripeErr.message.includes('No such subscription')) {
          return createResponse(null, { code: 'BAD_REQUEST', message: `Erro ao cancelar no Stripe: ${stripeErr.message}` }, 400)
        }
      }
    }

    // 5. Update local database tables
    // Update user_subscriptions
    await supabaseService
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        tier: 'free',
        cancel_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    // Update user profile
    await supabaseService
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_until: null
      })
      .eq('id', user.id)

    // Log subscription event
    await supabaseService
      .from('subscription_events')
      .insert({
        user_id: user.id,
        event_type: refunded ? 'refund' : 'subscription_canceled',
        provider_id: subscriptionId || 'direct_payment',
        payload: {
          reason,
          refunded,
          eligible_for_refund: eligibleForRefund,
          refund_error: refundErrorLog,
          cancelled_at: new Date().toISOString()
        }
      })

    // 6. Send notification email to the user
    try {
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      if (profile && profile.email) {
        const fullName = profile.full_name || 'Assinante'
        const refundNoticeHtml = refunded
          ? `<p style="margin-bottom: 16px; font-size: 16px;">
               Além disso, como a sua solicitação foi feita dentro do prazo de garantia de 7 dias, <strong>o reembolso da última cobrança foi processado com sucesso</strong> e constará na fatura do seu cartão em alguns dias úteis.
             </p>`
          : `<p style="margin-bottom: 16px; font-size: 16px;">
               Como o prazo de 7 dias de garantia já havia expirado, não foi gerado reembolso. Seu acesso Pro foi removido e você não receberá novas cobranças.
             </p>`

        const bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Assinatura Cancelada, ${fullName}
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Esta é a confirmação de que sua assinatura Premium do Cardappio foi cancelada e o seu acesso aos recursos Pro foi interrompido.
          </p>
          ${refundNoticeHtml}
          <p style="margin-bottom: 16px; font-size: 16px;">
            Agradecemos pelo tempo em que esteve conosco e lamentamos ver você partir. Se mudar de ideia no futuro, as portas estarão sempre abertas!
          </p>
        `
        const emailHtml = await getEmailTemplate(bodyHtml, refunded ? 'Reembolso e Cancelamento de Assinatura' : 'Confirmação de Cancelamento')
        await sendEmail({
          to: profile.email,
          subject: refunded ? 'Reembolso Processado — Cardappio' : 'Assinatura Cancelada — Cardappio',
          html: emailHtml
        })
      }
    } catch (emailErr) {
      console.error('Failed to send cancellation email:', emailErr)
    }

    return createResponse({
      success: true,
      refunded,
      eligible_for_refund: eligibleForRefund
    })

  } catch (err: any) {
    console.error('cancel-subscription failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
