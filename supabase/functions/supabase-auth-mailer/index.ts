import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"
import { sendEmail, getEmailTemplate } from '../_shared/email.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Received auth mailer hook payload:', JSON.stringify(payload, null, 2))

    const { user, email_data, metadata } = payload
    const emailActionType = metadata?.email_action_type || 'signup'
    const toEmail = user?.email || payload.email
    const token = email_data?.token
    const tokenHash = email_data?.token_hash
    // Normalize siteUrl to always use www if that is the main production domain
    let siteUrl = email_data?.site_url || 'https://www.cardappio.app.br'
    if (siteUrl === 'https://cardappio.app.br') {
      siteUrl = 'https://www.cardappio.app.br'
    }
    let redirectTo = email_data?.redirect_to || `${siteUrl}/app`
    if (emailActionType === 'recovery') {
      redirectTo = `${siteUrl}/auth/callback?type=recovery`
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || 'https://wkngjvsgafmdwejmckks.supabase.co'

    if (!toEmail) {
      console.warn('Destination email is missing in payload')
      return createResponse({ error: 'Missing to email' }, null, 400)
    }

    let subject = 'Mensagem de Cardappio'
    let bodyHtml = ''

    // Map email_action_type to URL verification type
    let verificationType = emailActionType
    if (emailActionType === 'signup') verificationType = 'signup'
    else if (emailActionType === 'recovery') verificationType = 'recovery'
    else if (emailActionType === 'magiclink') verificationType = 'magiclink'
    else if (emailActionType === 'invite') verificationType = 'invite'
    else if (emailActionType === 'email_change') verificationType = 'email_change'

    const confirmationUrl = tokenHash 
      ? `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${verificationType}&redirect_to=${encodeURIComponent(redirectTo)}`
      : null

    switch (emailActionType) {
      case 'signup':
        subject = 'Confirme seu cadastro no Cardappio'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Confirmação de Cadastro
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Obrigado por se cadastrar no Cardappio! Para ativar sua conta e começar a planejar suas refeições, confirme seu e-mail clicando no botão abaixo:
          </p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
            <tr>
              <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                <a href="${confirmationUrl}" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                  Confirmar E-mail
                </a>
              </td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 14px; color: #757575;">
            Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:<br/>
            <a href="${confirmationUrl}" style="color: #f76f25; word-break: break-all;">${confirmationUrl}</a>
          </p>
        `
        break

      case 'magiclink':
        subject = 'Seu link de acesso ao Cardappio'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Link de Acesso Rápido
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Clique no botão abaixo para fazer login instantaneamente na sua conta do Cardappio:
          </p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
            <tr>
              <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                <a href="${confirmationUrl}" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                  Entrar no Aplicativo
                </a>
              </td>
            </tr>
          </table>
          ${token ? `
          <p style="margin-bottom: 16px; font-size: 16px; text-align: center;">
            Ou use o código OTP de confirmação:<br/>
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #171d16; display: inline-block; padding: 8px 16px; background: #f1f5f9; border-radius: 8px; margin-top: 8px;">${token}</span>
          </p>
          ` : ''}
          <p style="margin-top: 24px; font-size: 14px; color: #757575;">
            Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:<br/>
            <a href="${confirmationUrl}" style="color: #f76f25; word-break: break-all;">${confirmationUrl}</a>
          </p>
        `
        break

      case 'recovery':
        subject = 'Redefinição de senha do Cardappio'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Redefinição de Senha
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Você solicitou a redefinição de senha para sua conta do Cardappio. Clique no botão abaixo para escolher uma nova senha:
          </p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
            <tr>
              <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                <a href="${confirmationUrl}" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                  Redefinir Senha
                </a>
              </td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 14px; color: #757575;">
            Se você não solicitou essa redefinição, por favor desconsidere este e-mail.
          </p>
        `
        break

      case 'invite':
        subject = 'Você foi convidado para o Cardappio!'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Convite para o Cardappio
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Você foi convidado a participar da plataforma Cardappio. Para aceitar seu convite e configurar sua senha, clique no botão abaixo:
          </p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
            <tr>
              <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                <a href="${confirmationUrl}" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                  Aceitar Convite
                </a>
              </td>
            </tr>
          </table>
        `
        break

      case 'email_change':
        subject = 'Confirme a alteração de e-mail no Cardappio'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Confirmação de Novo E-mail
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Você solicitou a alteração do e-mail cadastrado no Cardappio. Confirme seu novo endereço de e-mail clicando no botão abaixo:
          </p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
            <tr>
              <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                <a href="${confirmationUrl}" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                  Confirmar Novo E-mail
                </a>
              </td>
            </tr>
          </table>
        `
        break

      case 'password_changed_notification':
        subject = 'Sua senha do Cardappio foi alterada'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Senha Alterada com Sucesso
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            A senha da sua conta do Cardappio foi alterada recentemente.
          </p>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Se você realizou essa alteração, nenhuma ação adicional é necessária. Se você não reconhece essa atividade, por favor redefina sua senha ou entre em contato com nosso suporte imediatamente.
          </p>
        `
        break

      case 'email_changed_notification':
        subject = 'Notificação de alteração de e-mail do Cardappio'
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            E-mail Alterado
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            O endereço de e-mail da sua conta do Cardappio foi alterado.
          </p>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Se você realizou essa alteração, desconsidere este e-mail. Caso contrário, entre em contato imediatamente com o suporte.
          </p>
        `
        break

      default:
        subject = `Aviso de Segurança - Cardappio`
        bodyHtml = `
          <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
            Notificação de Segurança
          </h2>
          <p style="margin-bottom: 16px; font-size: 16px;">
            Informamos que um evento de tipo <strong>${emailActionType}</strong> ocorreu na sua conta.
          </p>
        `
    }

    const emailTemplate = await getEmailTemplate(bodyHtml, subject)
    const sendResult = await sendEmail({
      to: toEmail,
      subject: subject,
      html: emailTemplate
    })

    if (!sendResult.success) {
      console.error('Failed to send auth email via Nodemailer:', sendResult.error)
      return createResponse({ success: false, error: sendResult.error }, null, 500)
    }

    return createResponse({ success: true, message: 'Auth email sent and logged successfully' })

  } catch (err: any) {
    console.error('supabase-auth-mailer failed:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
