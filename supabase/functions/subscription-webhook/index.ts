import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import { updateUserSubscription, logSubscriptionEvent } from "../_shared/subscription.ts"
import Stripe from "npm:stripe"
import { sendEmail, getEmailTemplate } from "../_shared/email.ts"

/**
 * subscription-webhook
 * Receives events from Stripe, validates signatures using dynamic database settings.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') || ''

    const supabase = getServiceClient()

    // 1. Fetch Stripe config from database settings
    const { data: setting, error: settingError } = await supabase
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
    const webhookSecret = mode === 'production' ? config.production_webhook_secret : config.sandbox_webhook_secret

    if (!secretKey || !webhookSecret) {
      return createResponse(null, { code: 'BAD_REQUEST', message: `Stripe webhook secret or secret key for ${mode} mode is missing. Configure it in the Admin panel.` }, 400)
    }

    // 2. Initialize Stripe and construct event (Signature Verification)
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    })

    let event: any
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (constructErr: any) {
      console.error('Webhook signature verification failed:', constructErr.message)
      return createResponse(null, { code: 'UNAUTHORIZED', message: `Signature verification failed: ${constructErr.message}` }, 400)
    }

    // 3. Idempotency Check
    const eventId = event.id
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('provider_event_id', eventId)
      .single()

    if (existing) {
      return createResponse({ message: 'Event already processed' })
    }

    // 4. Process Event
    const eventType = event.type
    console.log(`Processing Stripe Webhook event: ${eventType} (${eventId})`)

    if (eventType === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const planId = session.metadata?.plan_id
      const billingPeriod = session.metadata?.billing_period || 'monthly'

      if (userId && planId) {
        // Update user subscription
        await updateUserSubscription(userId, {
          plan_id: planId,
          status: 'active',
          tier: 'premium',
          billing_cycle: billingPeriod === 'yearly' ? 'yearly' : 'monthly',
          current_period_end: new Date(Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: session.subscription || 'direct_payment'
        })

        // Sincronizar o tier do perfil do usuário para premium
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_until: new Date(Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', userId)

        await logSubscriptionEvent(userId, 'checkout_completed', eventId, event)

        // Send confirmation email
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

          if (profile && profile.email) {
            const fullName = profile.full_name || 'Assinante'
            const bodyHtml = `
              <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
                Sua assinatura Premium está ativa, ${fullName}!
              </h2>
              <p style="margin-bottom: 16px; font-size: 16px;">
                Obrigado por assinar o plano Premium do Cardappio! A partir de agora, você tem acesso ilimitado a todas as receitas, planejadores avançados e ferramentas exclusivas da nossa plataforma.
              </p>
              <p style="margin-bottom: 16px; font-size: 16px;">
                Aproveite o melhor que preparamos para você clicando no botão abaixo para começar a planejar sua semana:
              </p>
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
                <tr>
                  <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                    <a href="https://cardappio.app.br/app/semana" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                      Acessar Planejamento
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 24px; font-size: 14px; color: #757575;">
                Se tiver qualquer dúvida sobre sua assinatura ou pagamento, nossa equipe de suporte está à disposição.
              </p>
            `
            const emailHtml = await getEmailTemplate(bodyHtml, 'Sua Assinatura Premium está Ativa!')
            await sendEmail({
              to: profile.email,
              subject: 'Assinatura Premium Ativada! — Cardappio',
              html: emailHtml
            })
          }
        } catch (emailErr) {
          console.error('Failed to send checkout confirmation email:', emailErr)
        }
      }
    } 
    else if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object
      // Search for the user_subscription by Stripe subscription id
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_id')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle()

      if (userSub) {
        const userId = userSub.user_id
        
        // Update subscription record to canceled/inactive
        await updateUserSubscription(userId, {
          plan_id: userSub.plan_id,
          status: 'canceled',
          tier: 'free',
          billing_cycle: 'monthly',
          current_period_end: new Date().toISOString()
        })

        // Revert profile subscription tier to free
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_until: null
          })
          .eq('id', userId)

        await logSubscriptionEvent(userId, 'subscription_canceled', eventId, event)

        // Send cancellation email
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

          if (profile && profile.email) {
            const fullName = profile.full_name || 'Assinante'
            const bodyHtml = `
              <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
                Sua assinatura Premium foi cancelada, ${fullName}.
              </h2>
              <p style="margin-bottom: 16px; font-size: 16px;">
                Esta é a confirmação de que a sua assinatura Premium do Cardappio foi cancelada. Seu acesso aos recursos Premium permanecerá ativo até o final do período de faturamento atual.
              </p>
              <p style="margin-bottom: 16px; font-size: 16px;">
                Lamentamos ver você partir! Você pode reativar a sua assinatura a qualquer momento através da plataforma para voltar a ter acesso total aos planejadores e receitas.
              </p>
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
                <tr>
                  <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                    <a href="https://cardappio.app.br/app/configuracoes" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                      Gerenciar Conta
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 24px; font-size: 14px; color: #757575;">
                Agradecemos pelo tempo em que esteve conosco como membro Premium!
              </p>
            `
            const emailHtml = await getEmailTemplate(bodyHtml, 'Confirmação de Cancelamento de Assinatura')
            await sendEmail({
              to: profile.email,
              subject: 'Confirmação de Cancelamento de Assinatura — Cardappio',
              html: emailHtml
            })
          }
        } catch (emailErr) {
          console.error('Failed to send cancellation confirmation email:', emailErr)
        }
      }
    }
    else if (eventType === 'customer.subscription.updated') {
      const subscription = event.data.object
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_id')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle()

      if (userSub) {
        const userId = userSub.user_id
        const stripeStatus = subscription.status // e.g. trialing, active, past_due, canceled, unpaid
        const tier = (stripeStatus === 'active' || stripeStatus === 'trialing') ? 'premium' : 'free'
        
        await updateUserSubscription(userId, {
          plan_id: userSub.plan_id,
          status: stripeStatus === 'active' ? 'active' : stripeStatus === 'past_due' ? 'past_due' : 'canceled',
          tier: tier,
          billing_cycle: subscription.plan?.interval === 'year' ? 'yearly' : 'monthly',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })

        // Update profile
        await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_until: tier === 'premium' ? new Date(subscription.current_period_end * 1000).toISOString() : null
          })
          .eq('id', userId)

        await logSubscriptionEvent(userId, 'subscription_updated', eventId, event)
      }
    }

    // 5. Mark as processed
    await supabase.from('processed_webhook_events').insert({
      provider: 'stripe',
      provider_event_id: eventId
    })

    return createResponse({ success: true })

  } catch (err: any) {
    console.error('Webhook Error:', err.message)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
