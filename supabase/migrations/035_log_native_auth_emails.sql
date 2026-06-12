-- ============================================================
-- Migration 035: Log native Supabase Auth emails to email_logs
-- ============================================================
-- This migration creates a trigger on auth.users to detect when
-- Supabase sends native authentication emails (like confirmation,
-- recovery, etc.) and inserts a record into public.email_logs.
-- This allows the admin panel to display these emails without
-- needing a custom SMTP webhook setup.
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_supabase_native_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Confirmation Email (Signup)
  IF (TG_OP = 'INSERT' AND NEW.confirmation_sent_at IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.confirmation_sent_at IS DISTINCT FROM OLD.confirmation_sent_at AND NEW.confirmation_sent_at IS NOT NULL) THEN
    
    INSERT INTO public.email_logs (to_email, subject, body_html, status)
    VALUES (
      NEW.email, 
      'Confirmação de Cadastro (Nativo)', 
      '<div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; color: #475569; border: 1px solid #e2e8f0;">
        <p style="margin-top: 0;"><strong>E-mail Automático do Supabase</strong></p>
        <p>Este é o e-mail nativo de <strong>confirmação de cadastro</strong> gerado pelo motor de autenticação.</p>
        <p style="margin-bottom: 0; font-size: 0.9em; color: #64748b;"><em>Nota: Como o e-mail foi enviado diretamente pela infraestrutura do Supabase, o corpo exato (com o link clicável) não fica salvo no banco de dados.</em></p>
      </div>', 
      'sent'
    );
  END IF;

  -- 2. Password Recovery Email
  IF (TG_OP = 'INSERT' AND NEW.recovery_sent_at IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.recovery_sent_at IS DISTINCT FROM OLD.recovery_sent_at AND NEW.recovery_sent_at IS NOT NULL) THEN
    
    INSERT INTO public.email_logs (to_email, subject, body_html, status)
    VALUES (
      NEW.email, 
      'Recuperação de Senha (Nativo)', 
      '<div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; color: #475569; border: 1px solid #e2e8f0;">
        <p style="margin-top: 0;"><strong>E-mail Automático do Supabase</strong></p>
        <p>Este é o e-mail nativo de <strong>recuperação de senha</strong> gerado pelo motor de autenticação.</p>
        <p style="margin-bottom: 0; font-size: 0.9em; color: #64748b;"><em>Nota: Como o e-mail foi enviado diretamente pela infraestrutura do Supabase, o corpo exato (com o link clicável) não fica salvo no banco de dados.</em></p>
      </div>', 
      'sent'
    );
  END IF;

  -- 3. Email Change
  IF (TG_OP = 'INSERT' AND NEW.email_change_sent_at IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.email_change_sent_at IS DISTINCT FROM OLD.email_change_sent_at AND NEW.email_change_sent_at IS NOT NULL) THEN
    
    -- Ensure NEW.email_change is not null, otherwise fallback to NEW.email
    INSERT INTO public.email_logs (to_email, subject, body_html, status)
    VALUES (
      COALESCE(NEW.email_change, NEW.email), 
      'Alteração de E-mail (Nativo)', 
      '<div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; color: #475569; border: 1px solid #e2e8f0;">
        <p style="margin-top: 0;"><strong>E-mail Automático do Supabase</strong></p>
        <p>Este é o e-mail nativo de <strong>confirmação de troca de endereço de e-mail</strong> gerado pelo motor de autenticação.</p>
        <p style="margin-bottom: 0; font-size: 0.9em; color: #64748b;"><em>Nota: Como o e-mail foi enviado diretamente pela infraestrutura do Supabase, o corpo exato (com o link clicável) não fica salvo no banco de dados.</em></p>
      </div>', 
      'sent'
    );
  END IF;

  -- 4. Invite Email
  IF (TG_OP = 'INSERT' AND NEW.invited_at IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.invited_at IS DISTINCT FROM OLD.invited_at AND NEW.invited_at IS NOT NULL) THEN
    
    INSERT INTO public.email_logs (to_email, subject, body_html, status)
    VALUES (
      NEW.email, 
      'Convite para a Plataforma (Nativo)', 
      '<div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px; color: #475569; border: 1px solid #e2e8f0;">
        <p style="margin-top: 0;"><strong>E-mail Automático do Supabase</strong></p>
        <p>Este é o e-mail nativo de <strong>convite</strong> gerado pelo motor de autenticação.</p>
        <p style="margin-bottom: 0; font-size: 0.9em; color: #64748b;"><em>Nota: Como o e-mail foi enviado diretamente pela infraestrutura do Supabase, o corpo exato (com o link clicável) não fica salvo no banco de dados.</em></p>
      </div>', 
      'sent'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth operations due to logging failures
  RAISE WARNING 'Falha no log_supabase_native_emails: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Grant execution to postgres and service_role
GRANT EXECUTE ON FUNCTION public.log_supabase_native_emails() TO postgres;
GRANT EXECUTE ON FUNCTION public.log_supabase_native_emails() TO service_role;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_log_supabase_native_emails ON auth.users;
CREATE TRIGGER trg_log_supabase_native_emails
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_supabase_native_emails();
