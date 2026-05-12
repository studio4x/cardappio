
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getServiceClient, getAuthenticatedUser } from '../_shared/auth.ts'
import { isAdmin } from '../_shared/permissions.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    if (!user || !(await isAdmin(user.id))) {
      return errorResponse('Acesso negado. Apenas administradores podem realizar esta ação.', 403)
    }

    const { action, email, password, fullName, role, userId, newPassword } = await req.json()
    const supabaseAdmin = getServiceClient()

    if (action === 'create') {
      if (!email || !password) {
        return errorResponse('Email e senha são obrigatórios.', 400)
      }

      // 1. Create user in Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || '' }
      })

      if (authError) throw authError

      // 2. Update profile (the trigger might have already created it, but we ensure the role/full_name)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: role || 'user',
          full_name: fullName || ''
        })
        .eq('id', authUser.user.id)

      if (profileError) throw profileError

      return successResponse({ user: authUser.user }, 'Usuário criado com sucesso.')
    }

    if (action === 'reset_password') {
      if (!userId || !newPassword) {
        return errorResponse('ID do usuário e nova senha são obrigatórios.', 400)
      }

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )

      if (resetError) throw resetError

      return successResponse(null, 'Senha redefinida com sucesso.')
    }

    return errorResponse('Ação inválida.', 400)

  } catch (error: any) {
    console.error('Admin Users Error:', error)
    return errorResponse(error.message || 'Erro interno no servidor.', 500)
  }
})
