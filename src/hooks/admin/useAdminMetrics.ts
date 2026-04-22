import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * Fetch high-level metrics for the admin dashboard.
 */
export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      // 1. Total Users
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      // 2. Published Recipes
      const { count: recipeCount, error: recipeError } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      // 3. Admin user count
      const { count: adminCount, error: adminError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'super_admin'])

      // 4. Trial/Active Subscriptions (Lot 5)
      const { count: activeSubs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing'])

      // Log errors if any, but don't fail everything if one table is empty
      if (userError) console.error('User metric error:', userError)
      if (recipeError) console.error('Recipe metric error:', recipeError)

      return {
        totalUsers: userCount || 0,
        publishedRecipes: recipeCount || 0,
        adminUsers: adminCount || 0,
        activeSubscriptions: activeSubs || 0,
      }
    },
  })
}
