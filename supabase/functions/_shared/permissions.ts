/**
 * Permission helpers for Edge Functions
 * Per API_FUNCTIONS.md: _shared/permissions.ts
 *
 * Checks user roles and subscription status.
 */
import { getServiceClient } from './auth.ts'

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin' || data?.role === 'super_admin'
}

export async function getUserPlanAccess(userId: string): Promise<{
  plan: string
  isActive: boolean
}> {
  const supabase = getServiceClient()

  const { data } = await supabase
    .from('user_subscriptions')
    .select('plans(slug), status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!data) {
    return { plan: 'free', isActive: true }
  }

  return {
    plan: (data as unknown as { plans: { slug: string } }).plans?.slug ?? 'free',
    isActive: true,
  }
}
