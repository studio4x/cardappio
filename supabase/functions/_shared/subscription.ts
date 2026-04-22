/**
 * Subscription helpers for Edge Functions
 * Per API_FUNCTIONS.md: _shared/subscription.ts
 */
import { getServiceClient } from './auth.ts'

export async function updateUserSubscription(userId: string, data: {
  plan_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
  tier: 'free' | 'premium' | 'gold'
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  current_period_end?: string
  stripe_subscription_id?: string
}) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

export async function logSubscriptionEvent(userId: string, type: string, providerId: string, payload: any) {
  const supabase = getServiceClient()

  await supabase
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: type,
      provider_id: providerId,
      payload,
    })
}
