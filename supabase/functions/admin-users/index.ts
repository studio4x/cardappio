
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getServiceClient, getAuthenticatedUser } from '../_shared/auth.ts'
import { isAdmin } from '../_shared/permissions.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { sendEmail, getEmailTemplate } from '../_shared/email.ts'

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

      // 3. Send welcome email with credentials
      try {
        const origin = req.headers.get('origin') || 'https://cardappio-mauve.vercel.app'
        const isUserAdmin = role === 'admin' || role === 'super_admin'
        
        let bodyHtml = ''
        let subject = 'Bem-vindo ao Cardappio!'
        
        if (isUserAdmin) {
          subject = 'Acesso Administrativo ao Cardappio'
          bodyHtml = `
            <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
              Olá, ${fullName || 'Administrador'}!
            </h2>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Você foi cadastrado como <strong>Administrador</strong> na plataforma Cardappio. Abaixo estão suas credenciais de acesso temporárias:
            </p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 15px; color: #171d16;">
              <strong>E-mail:</strong> ${email}<br/>
              <strong>Senha:</strong> ${password}
            </div>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Como administrador, você pode gerenciar usuários, visualizar receitas, coleções e controlar as configurações gerais do aplicativo através do painel de administração.
            </p>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Acesse o painel de administração diretamente pelo botão abaixo:
            </p>
            <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
              <a href="${origin}/admin" class="btn" style="display: inline-block; background-color: #f76f25; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                Acessar Painel Admin
              </a>
            </div>
            <p style="margin-top: 24px; font-size: 14px; color: #757575;">
              Recomendamos alterar sua senha após o primeiro acesso para garantir a segurança da sua conta.
            </p>
          `
        } else {
          bodyHtml = `
            <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
              Olá, ${fullName || 'Usuário'}!
            </h2>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Sua conta foi criada no Cardappio. Estamos muito felizes em ter você conosco! Abaixo estão as suas credenciais para login:
            </p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 15px; color: #171d16;">
              <strong>E-mail:</strong> ${email}<br/>
              <strong>Senha:</strong> ${password}
            </div>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Você já pode começar a planejar o cardápio da sua semana, criar listas de compras e gerenciar suas receitas.
            </p>
            <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
              <a href="${origin}/login" class="btn" style="display: inline-block; background-color: #f76f25; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                Acessar Cardappio
              </a>
            </div>
            <p style="margin-top: 24px; font-size: 14px; color: #757575;">
              Recomendamos alterar sua senha após o primeiro login para maior segurança.
            </p>
          `
        }

        const emailHtml = await getEmailTemplate(bodyHtml, subject)
        await sendEmail({
          to: email,
          subject: subject,
          html: emailHtml
        })
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail de boas-vindas:', emailErr)
        // Não falhamos a criação do usuário se apenas o e-mail falhar,
        // mas informamos na resposta de sucesso para o admin
        return successResponse(
          { user: authUser.user }, 
          'Usuário criado com sucesso. Nota: Ocorreu uma falha no envio do e-mail de boas-vindas.'
        )
      }

      return successResponse({ user: authUser.user }, 'Usuário criado com sucesso e e-mail enviado.')
    }

    if (action === 'update_role') {
      if (!userId || !role) {
        return errorResponse('ID do usuário e role são obrigatórios.', 400)
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', userId)

      if (profileError) throw profileError

      return successResponse(null, 'Permissão atualizada com sucesso.')
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
    return errorResponse(error.message || 'Erro interno no servidor.', error.status || 500)
  }
})
