import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getServiceClient, getAuthenticatedUser } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * generate-share-link
 * Per API_FUNCTIONS.md: Generates a temporary shareable token for a week or shopping list.
 * 
 * Logic:
 * 1. Validate user and ownership of resource.
 * 2. Generate unique token (using crypto.randomUUID).
 * 3. Store in resource_shares table.
 * 4. Return token and expiry.
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

    const { resource_type, resource_id, expires_in_hours = 24 } = await req.json()

    if (!resource_type || !resource_id) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'resource_type and resource_id are required' }, 400)
    }

    const supabase = getSupabaseClient(req)
    const supabaseService = getServiceClient()

    // 1. Verify ownership
    let tableName = resource_type === 'week' ? 'meal_plan_weeks' : 'shopping_lists'
    const { data: resource, error: resourceError } = await supabase
      .from(tableName)
      .select('id, user_id')
      .eq('id', resource_id)
      .single()

    if (resourceError || !resource) {
       return createResponse(null, { code: 'NOT_FOUND', message: 'Resource not found or access denied' }, 404)
    }

    // 2. Generate token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours)

    // 3. Store share
    const { error: shareError } = await supabaseService
      .from('resource_shares')
      .insert({
        token,
        resource_type,
        resource_id,
        user_id: user.id,
        expires_at: expiresAt.toISOString()
      })

    if (shareError) throw shareError

    return createResponse({
      token,
      expires_at: expiresAt.toISOString(),
      share_url: `/share/${token}` // Frontend will prepend base URL
    })

  } catch (err: any) {
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
