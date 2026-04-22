import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getAuthenticatedUser } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * create-checkout-session
 * Per API_FUNCTIONS.md: Creates a payment session for subscription.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return createResponse(null, { code: 'UNAUTHORIZED' }, 401)

    const { plan_id, billing_period } = await req.json()
    if (!plan_id) return createResponse(null, { code: 'BAD_REQUEST' }, 400)

    const supabase = getSupabaseClient(req)

    // 1. Fetch Plan Details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Plan not found' }, 404)
    }

    // 2. Stripe Integration (MOCK/PLACEHOLDER)
    // Normally we'd use stripe.checkout.sessions.create here.
    const mockCheckoutUrl = `https://checkout.stripe.com/pay/mock_session_${Math.random().toString(36).substring(7)}`
    
    return createResponse({
      checkout_url: mockCheckoutUrl,
      plan_name: plan.name,
      user_email: user.email
    })

  } catch (err: any) {
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
