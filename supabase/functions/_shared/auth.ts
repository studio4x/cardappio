/**
 * Auth helpers for Edge Functions
 * Per API_FUNCTIONS.md: _shared/auth.ts
 *
 * Extracts and validates the JWT from the Authorization header.
 * Returns the authenticated user or null.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader ?? '',
        },
      },
    }
  )
}

export function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function getAuthenticatedUser(req: Request) {
  const supabase = getSupabaseClient(req)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}
