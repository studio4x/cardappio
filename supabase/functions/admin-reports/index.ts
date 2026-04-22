import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient, getAuthenticatedUser } from "../_shared/auth.ts"
import { isAdmin } from "../_shared/permissions.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * admin-reports
 * Per API_FUNCTIONS.md: Returns consolidated metrics for the admin dashboard.
 * 
 * Logic:
 * 1. Validate if user is Admin.
 * 2. Fetch stats (Users count, Weekly plans, Top recipes).
 * 3. Return structured data.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return createResponse(null, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { data: profile } = await getServiceClient()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdmin(profile.role)) {
      return createResponse(null, { code: 'FORBIDDEN', message: 'Admin access required' }, 403)
    }

    const supabase = getServiceClient()

    // Aggregate statistics
    const [
      { count: totalUsers },
      { count: premiumUsers },
      { count: totalRecipes },
      { data: recentWeeks }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
      supabase.from('recipes').select('*', { count: 'exact', head: true }),
      supabase.from('meal_plan_weeks').select('created_at').order('created_at', { ascending: false }).limit(100)
    ])

    return createResponse({
      stats: {
        total_users: totalUsers || 0,
        premium_users: premiumUsers || 0,
        total_recipes: totalRecipes || 0,
        conversion_rate: totalUsers ? ((premiumUsers || 0) / totalUsers) * 100 : 0
      },
      activity: {
        recent_weeks_count: recentWeeks?.length || 0
      }
    })

  } catch (err: any) {
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
