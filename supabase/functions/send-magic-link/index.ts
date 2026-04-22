import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * send-magic-link
 * Per API_FUNCTIONS.md: Initiates login/signup via magic link with logging.
 * 
 * Logic:
 * 1. Validate email input.
 * 2. Call supabase.auth.signInWithOtp.
 * 3. Log attempt (if audit tables exist).
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, redirect_to } = await req.json()

    if (!email) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Email is required' }, 400)
    }

    const supabaseAdmin = getServiceClient()

    // Send OTP / Magic Link
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirect_to || undefined,
      },
    })

    if (error) {
      console.error('Error sending magic link:', error.message)
      return createResponse(null, { code: 'INTEGRATION_ERROR', message: error.message }, 400)
    }

    // Optional: Log attempt in a custom table if needed for analytics/security
    // await supabaseAdmin.from('auth_logs').insert({ email, action: 'magic_link_sent' })

    return createResponse({
      message: 'Magic link sent successfully'
    })

  } catch (err: any) {
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
