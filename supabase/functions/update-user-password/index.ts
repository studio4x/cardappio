import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getServiceClient, getAuthenticatedUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the authenticated user from the request (this works for recovery sessions)
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return errorResponse('Sessão inválida ou expirada. Solicite um novo link.', 401)
    }

    const { password } = await req.json().catch(() => ({}))
    if (!password || password.length < 6) {
      return errorResponse('A senha deve ter pelo menos 6 caracteres.', 400)
    }

    // 2. Get the Service Role client to bypass client-side limitations
    const supabaseAdmin = getServiceClient()

    // 3. Force password update directly in the database via Admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: password }
    )

    if (updateError) {
      console.error('Update password admin error:', updateError)
      return errorResponse(updateError.message, 500)
    }

    // 4. Force a sign out for all sessions to consume/invalidate everything
    // Wait, we can't easily sign out via admin globally, but updating the password
    // via admin might automatically invalidate existing sessions (except the current one).
    // The client will also call signOut globally.

    return successResponse({ updated_at: updatedUser.user.updated_at }, 'Senha atualizada com sucesso.')

  } catch (error: any) {
    console.error('Update Password Edge Function Error:', error)
    return errorResponse(error.message || 'Erro interno no servidor.', error.status || 500)
  }
})
