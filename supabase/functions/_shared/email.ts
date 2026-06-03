/**
 * Email helpers for Edge Functions
 * Uses Nodemailer via SMTP to send custom emails.
 */
import { getServiceClient } from './auth.ts'
import nodemailer from 'npm:nodemailer@6.9.10'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Sends an email using SMTP credentials fetched from app_settings
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const supabase = getServiceClient()
  
  // 1. Get email config from app_settings
  const { data: configData, error: configError } = await supabase
    .from('app_settings')
    .select('value_json')
    .eq('setting_key', 'email_config')
    .single()

  if (configError || !configData) {
    console.error('Erro ao buscar configuração de e-mail:', configError)
    throw new Error('Configuração de e-mail não encontrada em app_settings.')
  }

  const emailConfig = (configData.value_json || {}) as {
    provider?: string
    smtp_host?: string
    smtp_port?: number
    smtp_user?: string
    smtp_pass?: string
    from_email?: string
    from_name?: string
  }

  const logEmail = async (status: 'sent' | 'failed', errorMessage: string | null = null) => {
    try {
      await supabase
        .from('email_logs')
        .insert({
          to_email: to,
          subject,
          body_html: html,
          status,
          error_message: errorMessage
        })
    } catch (logErr) {
      console.error('Falha ao gravar log de email no banco:', logErr)
    }
  }

  const host = emailConfig.smtp_host
  const port = Number(emailConfig.smtp_port || 587)
  const user = emailConfig.smtp_user
  const pass = emailConfig.smtp_pass
  const fromEmail = emailConfig.from_email || 'contato@studio4x.com.br'
  const fromName = emailConfig.from_name || 'Cardappio'

  if (!host || !user || !pass) {
    const errorDetail = 'Configurações de SMTP incompletas (Host, Usuário ou Senha ausentes).'
    console.warn(errorDetail)
    await logEmail('failed', errorDetail)
    return { success: false, error: errorDetail }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465 (SSL), false for other ports (TLS/STARTTLS)
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    })

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    })

    await logEmail('sent')
    return { success: true, data: info }
  } catch (err: any) {
    console.error('Falha ao enviar e-mail via SMTP:', err)
    const errorMsg = err.message || String(err)
    await logEmail('failed', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Wraps body content in a beautiful, responsive HTML email template using the visual identity logo.
 */
export async function getEmailTemplate(bodyContent: string, previewText = 'Mensagem de Cardappio'): Promise<string> {
  const supabase = getServiceClient()
  
  // Get visual identity
  const { data: identityData } = await supabase
    .from('app_settings')
    .select('value_json')
    .eq('setting_key', 'visual_identity')
    .single()

  const visualIdentity = (identityData?.value_json || {}) as {
    logo_light_url?: string
    logo_dark_url?: string
  }

  const logoUrl = visualIdentity.logo_light_url || visualIdentity.logo_dark_url

  const logoHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="Cardappio" style="max-height: 48px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;" />`
    : `<table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: #f76f25; border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            🍳
          </td>
          <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #171d16; letter-spacing: -0.5px; padding-left: 8px;">
            Cardappio
          </td>
        </tr>
      </table>`

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${previewText}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Work+Sans:wght@400;500&display=swap');
        body {
          font-family: 'Work Sans', Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
          border: 1px solid #e2e8f0;
        }
        .header {
          padding: 32px;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .content {
          padding: 40px 32px;
          color: #171d16;
          line-height: 1.6;
        }
        .footer {
          padding: 32px;
          text-align: center;
          background-color: #f8fafc;
          border-top: 1px solid #f1f5f9;
          font-size: 12px;
          color: #757575;
        }
        .btn {
          display: inline-block;
          background-color: #f76f25;
          color: #ffffff !important;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 24px;
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
          <p style="margin: 0;">© ${new Date().getFullYear()} Cardappio. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
