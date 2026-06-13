
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

    const body = await req.json().catch(() => ({}))
    const { action, email, password, fullName, role, userId, newPassword } = body
    const supabaseAdmin = getServiceClient()

    if (action === 'list') {
      // 1. Fetch all users from Supabase Auth
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) throw authError

      // 2. Fetch all profiles from public.profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
      if (profilesError) throw profilesError

      // Create a map of profiles by user ID
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]))

      // 3. Merge profiles and auth users, ensuring every auth user has a representation
      const mergedUsers = authUsers.map(u => {
        const profile = profilesMap.get(u.id)
        return {
          id: u.id,
          email: u.email || '',
          full_name: profile?.full_name || u.user_metadata?.full_name || null,
          role: profile?.role || u.user_metadata?.role || 'user',
          status: profile?.status || 'active',
          onboarding_completed_at: profile?.onboarding_completed_at || null,
          subscription_tier: profile?.subscription_tier || 'free',
          subscription_until: profile?.subscription_until || null,
          created_at: u.created_at,
          updated_at: profile?.updated_at || u.updated_at || u.created_at
        }
      })

      // Sort by created_at descending
      mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      return successResponse({ users: mergedUsers })
    }

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

      // 2. Upsert profile (ensure the profile exists with the correct role/full_name/email/status)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: authUser.user.id,
          email,
          role: role || 'user',
          full_name: fullName || '',
          status: 'active'
        })

      if (profileError) throw profileError

      // 3. Send welcome email with credentials
      try {
        const origin = req.headers.get('origin') || 'https://cardappio.app.br'
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
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 15px; color: #171d16;">
                  <strong>E-mail:</strong> ${email}<br/>
                  <strong>Senha:</strong> ${password}
                </td>
              </tr>
            </table>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Como administrador, você pode gerenciar usuários, visualizar receitas, coleções e controlar as configurações gerais do aplicativo através do painel de administração.
            </p>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Acesse o painel de administração diretamente pelo botão abaixo:
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
              <tr>
                <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                  <a href="${origin}/admin" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                    Acessar Painel Admin
                  </a>
                </td>
              </tr>
            </table>
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
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 15px; color: #171d16;">
                  <strong>E-mail:</strong> ${email}<br/>
                  <strong>Senha:</strong> ${password}
                </td>
              </tr>
            </table>
            <p style="margin-bottom: 16px; font-size: 16px;">
              Você já pode começar a planejar o cardápio da sua semana, criar listas de compras e gerenciar suas receitas.
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
              <tr>
                <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                  <a href="${origin}/login" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                    Acessar Cardappio
                  </a>
                </td>
              </tr>
            </table>
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

    if (action === 'update_plan') {
      const planTier = body.planTier || body.tier
      if (!userId || !planTier) {
        return errorResponse('ID do usuário e plano (planTier) são obrigatórios.', 400)
      }

      if (planTier === 'free' || planTier === 'plano-gratuito') {
        const { error: deleteError } = await supabaseAdmin
          .from('user_subscriptions')
          .delete()
          .eq('user_id', userId)

        if (deleteError) throw deleteError

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_until: null
          })
          .eq('id', userId)

        if (profileError) throw profileError
      } else {
        const { data: plan, error: planError } = await supabaseAdmin
          .from('subscription_plans')
          .select('id')
          .eq('slug', planTier)
          .single()

        if (planError || !plan) {
          return errorResponse(`Plano com slug "${planTier}" não encontrado.`, 400)
        }

        const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            tier: planTier,
            billing_cycle: 'monthly',
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: false
          }, {
            onConflict: 'user_id'
          })

        if (subError) throw subError

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: planTier,
            subscription_until: currentPeriodEnd
          })
          .eq('id', userId)

        if (profileError) throw profileError
      }

      return successResponse(null, 'Plano do usuário atualizado com sucesso.')
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

    }

    if (action === 'delete') {
      if (!userId) {
        return errorResponse('ID do usuário é obrigatório.', 400)
      }

      if (userId === user.id) {
        return errorResponse('Não é possível excluir sua própria conta.', 400)
      }

      // Check the role of the user to be deleted
      const { data: targetProfile, error: getProfileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (getProfileError && getProfileError.code !== 'PGRST116') {
        throw getProfileError
      }

      const targetRole = targetProfile?.role || 'user'

      if (targetRole === 'admin' || targetRole === 'super_admin') {
        return errorResponse('Acesso negado. Não é permitido excluir usuários administradores.', 400)
      }

      // Delete the user from Auth (will cascade delete profile and other table relations)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError

      return successResponse(null, 'Usuário excluído com sucesso.')
    }

    if (action === 'send_test_email') {
      const { toEmail, testSubject, testBody } = body
      if (!toEmail) {
        return errorResponse('E-mail do destinatário é obrigatório.', 400)
      }

      const subject = testSubject || 'E-mail de Teste do Cardappio'
      const htmlContent = testBody || `
        <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
          Teste de SMTP Realizado com Sucesso!
        </h2>
        <p style="margin-bottom: 16px; font-size: 16px;">
          Este é um e-mail de teste enviado a partir das configurações SMTP da plataforma Cardappio.
        </p>
        <p style="margin-bottom: 16px; font-size: 16px;">
          Se você recebeu esta mensagem, suas credenciais de servidor de e-mail SMTP estão funcionando perfeitamente.
        </p>
      `

      const emailHtml = await getEmailTemplate(htmlContent, subject)
      const emailResult = await sendEmail({
        to: toEmail,
        subject: subject,
        html: emailHtml
      })

      if (!emailResult.success) {
        return errorResponse(`Falha ao enviar e-mail de teste: ${emailResult.error}`, 400)
      }

      return successResponse(null, 'E-mail de teste enviado com sucesso!')
    }

    return errorResponse('Ação inválida.', 400)

  } catch (error: any) {
    console.error('Admin Users Error:', error)
    return errorResponse(error.message || 'Erro interno no servidor.', error.status || 500)
  }
})
