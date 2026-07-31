-- ============================================================
-- CARDAPPIO — Migration 035: Remove initial free plan on signup
-- and assign 15-day Pro trial (plano-pro-14-dias)
-- ============================================================

-- 1. Update default subscription_tier on profiles table
ALTER TABLE public.profiles 
  ALTER COLUMN subscription_tier SET DEFAULT 'plano-pro-14-dias';

-- 2. Update handle_new_user trigger function to assign 15-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    status, 
    subscription_tier, 
    subscription_until
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
    'user',
    'active',
    'plano-pro-14-dias',
    now() + interval '15 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = CASE
      WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name
      ELSE profiles.full_name
    END,
    updated_at = now();

  -- Cria preferências padrão se não existirem
  INSERT INTO public.user_preferences (id, user_id)
  VALUES (gen_random_uuid(), NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user falhou para o usuário %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 3. Garante que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
