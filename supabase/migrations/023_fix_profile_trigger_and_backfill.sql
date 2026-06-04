-- ============================================================
-- Migration 023: Fix profile auto-creation trigger and backfill
-- ============================================================
-- Problema: o trigger handle_new_user não está criando profiles
-- para todos os usuários no ambiente de produção.
-- Esta migration:
-- 1. Recria o trigger com lógica mais robusta
-- 2. Faz backfill de todos os auth.users sem profile correspondente
-- ============================================================

-- 1. Recria a função handle_new_user com tratamento de erro mais robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = CASE 
      WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END,
    updated_at = now();

  -- Also create default user preferences if they don't exist
  INSERT INTO public.user_preferences (id, user_id)
  VALUES (uuid_generate_v4(), NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but do not fail signup
  RAISE WARNING 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Garante que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: cria profiles para auth.users que não têm profile ainda
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, ''), '@', 1), ''),
  'user',
  'active'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill: cria user_preferences para profiles que não têm
INSERT INTO public.user_preferences (id, user_id)
SELECT uuid_generate_v4(), p.id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences up WHERE up.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Garante permissões corretas
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
