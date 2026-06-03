import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, '../.env.local');
let token = '';

try {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'SUPABASE_ACCESS_TOKEN') token = val;
    }
  }
} catch (e) {
  console.error("Could not read .env.local:", e.message);
}

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local!");
  process.exit(1);
}

function getAuthTemplateHtml(title, previewText, description, buttonText, confirmationUrl, subtext) {
  return `<!DOCTYPE html>
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
    @media (prefers-color-scheme: dark) {
      .logo-img {
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.65)) !important;
        -webkit-filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.65)) !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="background-color: #f8fafc; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td>
        <![endif]-->
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" valign="top" style="padding: 32px; border-bottom: 1px solid #f1f5f9;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="180" style="width: 180px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <img src="https://wkngjvsgafmdwejmckks.supabase.co/storage/v1/object/public/system/brand/logo_dark-fz5zzjzfsbk.png" alt="Cardappio" width="180" border="0" class="logo-img" style="border: 0; outline: none; text-decoration: none; display: block; width: 180px; height: auto; max-width: 180px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td align="center" valign="top" style="padding: 40px 32px; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #171d16; text-align: center;">
              <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
                ${title}
              </h2>
              <p style="margin-bottom: 24px; font-size: 16px; color: #3f4a3c; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                ${description}
              </p>
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto; border-collapse: collapse;">
                <tr>
                  <td align="center" bgcolor="#f76f25" style="border-radius: 8px; background-color: #f76f25;">
                    <a href="${confirmationUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; background-color: #f76f25; border-top: 12px solid #f76f25; border-bottom: 12px solid #f76f25; border-left: 24px solid #f76f25; border-right: 24px solid #f76f25; border-radius: 8px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 24px; font-size: 14px; color: #757575; text-align: center;">
                ${subtext}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" valign="top" style="padding: 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-family: 'Work Sans', Arial, sans-serif; font-size: 12px; color: #757575;">
              <p style="margin: 0 0 8px 0; color: #757575; font-size: 12px;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
              <p style="margin: 0; color: #757575; font-size: 12px;">© ${new Date().getFullYear()} Cardappio. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const templates = {
  mailer_templates_confirmation_content: getAuthTemplateHtml(
    'Confirme seu e-mail',
    'Confirme seu e-mail no Cardappio',
    'Obrigado por se cadastrar no Cardappio! Para ativar a sua conta e começar a organizar seu planejamento semanal, por favor confirme o seu e-mail clicando no botão abaixo:',
    'Confirmar E-mail',
    '{{ .ConfirmationURL }}',
    'Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.'
  ),
  mailer_templates_invite_content: getAuthTemplateHtml(
    'Você foi convidado!',
    'Você foi convidado para o Cardappio',
    'Você foi convidado para participar da plataforma Cardappio. Para aceitar o seu convite e ativar a sua conta, por favor clique no botão abaixo:',
    'Aceitar Convite',
    '{{ .ConfirmationURL }}',
    'Este link de convite expirará em breve.'
  ),
  mailer_templates_magic_link_content: getAuthTemplateHtml(
    'Link de Acesso Rápido',
    'Seu link de acesso ao Cardappio',
    'Clique no botão abaixo para entrar de forma rápida e segura na sua conta do Cardappio:',
    'Entrar no Cardappio',
    '{{ .ConfirmationURL }}',
    'Se você não solicitou este link de acesso, por favor ignore este e-mail.'
  ),
  mailer_templates_recovery_content: getAuthTemplateHtml(
    'Redefinir Senha',
    'Redefinição de senha do Cardappio',
    'Recebemos um pedido para redefinir a senha da sua conta no Cardappio. Para cadastrar uma nova senha, por favor clique no botão abaixo:',
    'Redefinir Senha',
    '{{ .ConfirmationURL }}',
    'Se você não fez essa solicitação, pode ignorar este e-mail com segurança. Sua senha atual continuará funcionando normalmente.'
  ),
  mailer_templates_email_change_content: getAuthTemplateHtml(
    'Confirme a alteração de seu e-mail',
    'Confirme a alteração de seu e-mail',
    'Recebemos uma solicitação para alterar o endereço de e-mail associado à sua conta no Cardappio. Para confirmar essa alteração, por favor clique no botão abaixo:',
    'Confirmar Novo E-mail',
    '{{ .ConfirmationURL }}',
    'Se você não fez essa solicitação, pode ignorar este e-mail com segurança.'
  )
};

const url = `https://api.supabase.com/v1/projects/wkngjvsgafmdwejmckks/config/auth`;

async function run() {
  console.log('Sending PATCH request to update Supabase Auth templates...');
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templates)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Templates successfully updated on Supabase!');
      console.log('API Response keys updated:', Object.keys(data).filter(k => k.startsWith('mailer_templates')));
    } else {
      const errText = await response.text();
      console.error(`Failed to update templates (HTTP ${response.status}):`, errText);
    }
  } catch (err) {
    console.error('Error occurred during request:', err);
  }
}

run();
