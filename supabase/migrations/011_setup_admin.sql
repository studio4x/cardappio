-- ============================================================
-- Migration 011: Setup Admin Account
-- ============================================================

-- 1. Update trigger function to auto-promote specific email to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  final_role TEXT := 'user';
BEGIN
  -- Auto-promote specific emails to admin
  IF NEW.email = 'contato@studio4x.com.br' THEN
    final_role := 'admin';
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      final_role,
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      role = EXCLUDED.role;
      
    INSERT INTO public.user_preferences (id, user_id)
    VALUES (uuid_generate_v4(), NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. If the user already exists in auth.users (but not in profiles), 
-- this migration will also promote them if they are ever re-inserted
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'contato@studio4x.com.br';
