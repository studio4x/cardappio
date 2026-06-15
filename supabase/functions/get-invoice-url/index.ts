import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import Stripe from "npm:stripe"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) return createResponse(null, { code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401)

    const { invoiceId, subscriptionId } = await req.json()
    if (!invoiceId && !subscriptionId) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Invoice ID or Subscription ID is required' }, 400)
    }

    const supabaseService = getServiceClient()

    // 2. Fetch Stripe config
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

    // 3. Fetch invoice details from Stripe
    let invoice: any
    if (subscriptionId && subscriptionId !== 'direct_payment') {
      try {
        const invoices = await stripe.invoices.list({
          subscription: subscriptionId,
          limit: 1,
        })
        if (invoices.data.length === 0) {
          return createResponse(null, { code: 'NOT_FOUND', message: 'Nenhuma fatura encontrada para esta assinatura.' }, 404)
        }
        invoice = invoices.data[0]
      } catch (stripeErr: any) {
        return createResponse(null, { code: 'BAD_REQUEST', message: `Erro ao buscar faturas na Stripe: ${stripeErr.message}` }, 400)
      }
    } else if (invoiceId) {
      invoice = await stripe.invoices.retrieve(invoiceId)
    } else {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Assinatura inválida para faturamento Stripe.' }, 400)
    }
    
    // Safety check: ensure this invoice belongs to this user (unless admin)
    // First check user's role
    const { data: profile } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (!isAdmin) {
      const { data: userSub } = await supabaseService
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const customerEmail = invoice.customer_email || invoice.customer_details?.email
      if (invoice.customer !== userSub?.stripe_customer_id && customerEmail !== user.email) {
        return createResponse(null, { code: 'UNAUTHORIZED', message: 'Invoice does not belong to the user' }, 401)
      }
    }

    return createResponse({
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf
    })

  } catch (err: any) {
    console.error('get-invoice-url failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
