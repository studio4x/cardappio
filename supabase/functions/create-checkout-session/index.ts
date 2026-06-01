import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import Stripe from "npm:stripe"

/**
 * create-checkout-session
 * Creates a real payment session for subscription.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return createResponse(null, { code: 'UNAUTHORIZED' }, 401)

    const { plan_id, billing_period = 'monthly' } = await req.json()
    if (!plan_id) return createResponse(null, { code: 'BAD_REQUEST', message: 'plan_id is required' }, 400)

    const supabase = getSupabaseClient(req)
    const supabaseService = getServiceClient()

    // 1. Fetch Plan Details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Plan not found' }, 404)
    }

    // 2. Fetch Stripe config from database settings
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
      return createResponse(null, { code: 'BAD_REQUEST', message: `Stripe secret key for ${mode} mode is missing. Configure it in the Admin panel.` }, 400)
    }

    // Determine the Price ID based on billing period
    const priceId = billing_period === 'yearly' ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly

    if (!priceId) {
      return createResponse(null, { code: 'BAD_REQUEST', message: `Price ID for billing period '${billing_period}' is not configured on this plan.` }, 400)
    }

    // 3. Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    })

    const appUrl = req.headers.get('origin') || "https://cardappio-mauve.vercel.app"

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/app/perfil?session_id={CHECKOUT_SESSION_ID}&checkout=success`,
      cancel_url: `${appUrl}/app/perfil?checkout=cancel`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
        billing_period: billing_period
      }
    })

    return createResponse({
      checkout_url: session.url,
      plan_name: plan.name,
      user_email: user.email
    })

  } catch (err: any) {
    console.error('create-checkout-session failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
