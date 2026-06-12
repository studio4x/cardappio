-- ============================================================
-- Migration 034: Fix profile INSERT RLS + reinforce trigger
-- ============================================================
-- Problema: novos usuários não conseguem fazer login porque o
-- profile não é criado automaticamente pelo trigger e não existe
-- política de INSERT na tabela profiles para o próprio usuário.
--
-- Esta migration:
-- 1. Adiciona política de INSERT para o próprio usuário em profiles
-- 2. Adiciona política de INSERT para o próprio usuário em user_preferences
-- 3. Recria o trigger handle_new_user com SET search_path robusto
-- 4. Faz backfill de auth.users sem profile
-- ============================================================

-- 1. Política de INSERT em profiles para o próprio usuário
--    (necessária para o auto-upsert do AuthProvider quando o trigger falha)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Política de INSERT em user_preferences para o próprio usuário
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Garante política de SELECT em user_preferences para o próprio usuário
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Garante política de UPDATE em user_preferences para o próprio usuário
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Recria o trigger handle_new_user com robustez máxima
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
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

-- Garante que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill: cria profiles para auth.users que ainda não têm
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(COALESCE(u.email, ''), '@', 1),
    ''
  ),
  'user',
  'active'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 7. Backfill: cria user_preferences para profiles que ainda não têm
INSERT INTO public.user_preferences (id, user_id)
SELECT gen_random_uuid(), p.id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences up WHERE up.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;
