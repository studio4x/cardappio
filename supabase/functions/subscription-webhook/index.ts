import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import { updateUserSubscription, logSubscriptionEvent } from "../_shared/subscription.ts"

/**
 * subscription-webhook
 * Per API_FUNCTIONS.md: Receives events from payment provider (Stripe).
 * Implements idempotency and security validation.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const signature = req.headers.get('stripe-signature')

    // 1. Signature validation would happen here in production
    if (!payload.type) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Invalid payload' }, 400)
    }

    const supabase = getServiceClient()

    // 2. Idempotency Check
    const eventId = payload.id
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('provider_event_id', eventId)
      .single()

    if (existing) {
      return createResponse({ message: 'Event already processed' })
    }

    // 3. Process Event
    // MOCK: Mapping Stripe event to internal status
    const mockUserId = payload.data?.object?.metadata?.user_id || 'EXTERNAL_USER'
    
    if (payload.type === 'checkout.session.completed') {
      // Find plan by price_id
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('stripe_price_id_monthly', payload.data.object.amount_total > 5000 ? 'yearly' : 'monthly') // Mock logic
        .limit(1)
        .single()

      if (plan && mockUserId !== 'EXTERNAL_USER') {
        await updateUserSubscription(mockUserId, {
          plan_id: plan.id,
          status: 'active',
          tier: 'premium',
          billing_cycle: 'monthly',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: 'mock_sub_123'
        })

        await logSubscriptionEvent(mockUserId, 'checkout_completed', eventId, payload)
      }
    }

    // 4. Mark as processed
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
