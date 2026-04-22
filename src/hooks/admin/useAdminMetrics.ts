import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * Fetch high-level metrics for the admin dashboard using the secure Edge Function.
 */
export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-reports')

      if (error) {
        console.error('Error fetching admin reports:', error)
        throw error
      }

      // Map backend stats to the frontend expected shape
      const stats = data.data.stats
      const activity = data.data.activity

      return {
        totalUsers: stats.total_users || 0,
        premiumUsers: stats.premium_users || 0,
        publishedRecipes: stats.total_recipes || 0, // Using total recipes as published for now
        conversionRate: stats.conversion_rate || 0,
        recentActivityCount: activity.recent_weeks_count || 0,
      }
    },
  })
}
