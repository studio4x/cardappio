import type { Profile } from '@/types/auth'

/**
 * Helper utility to determine if a user profile currently has active PRO status.
 *
 * Rules:
 * - Returns false if profile is null/undefined.
 * - Returns false if tier is 'free' or 'plano-gratuito'.
 * - If tier is a trial tier ('plano-pro-14-dias', 'plano-pro-7-dias') or has subscription_until:
 *   - Checks if subscription_until or created_at + 15 days has expired.
 *   - If expired, returns false.
 * - Otherwise returns true for active PRO plans.
 */
export function isUserPro(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  
  // Administrators and super administrators always have PRO access
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    return true
  }

  const tier = profile.subscription_tier

  if (!tier || tier === 'free' || tier === 'plano-gratuito') {
    return false
  }

  // Check trial expiration date
  if (profile.subscription_until) {
    const expiresAt = new Date(profile.subscription_until).getTime()
    if (!isNaN(expiresAt) && expiresAt <= Date.now()) {
      return false
    }
  } else if (tier === 'plano-pro-14-dias' || tier === 'plano-pro-7-dias') {
    // Fallback: check 15 days from created_at if subscription_until is missing
    if (profile.created_at) {
      const createdAt = new Date(profile.created_at).getTime()
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000
      if (!isNaN(createdAt) && createdAt + fifteenDaysMs <= Date.now()) {
        return false
      }
    }
  }

  return true
}

/**
 * Returns trial expiration status info for a user.
 */
export function getTrialInfo(profile: Profile | null | undefined) {
  if (!profile) return { isTrial: false, isExpired: false, daysRemaining: 0, expirationDate: null }
  
  const isTrialTier = profile.subscription_tier === 'plano-pro-14-dias' || profile.subscription_tier === 'plano-pro-7-dias'
  if (!isTrialTier) return { isTrial: false, isExpired: false, daysRemaining: 0, expirationDate: null }

  const expirationDate = profile.subscription_until 
    ? new Date(profile.subscription_until) 
    : new Date(new Date(profile.created_at || Date.now()).getTime() + 15 * 24 * 60 * 60 * 1000)

  const diffMs = expirationDate.getTime() - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const isExpired = diffMs <= 0

  return {
    isTrial: true,
    isExpired,
    daysRemaining,
    expirationDate,
  }
}
