-- ============================================================
-- Migration 012: Fix RLS Infinite Recursion
-- ============================================================

-- 1. Create a SECURITY DEFINER function to safely check admin roles
-- This explicitely bypasses RLS on the profiles table via SECURITY DEFINER
-- which breaks the "infinite recursion" loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN v_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the original recursive policies on core user tables
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "user_preferences_select_admin" ON public.user_preferences;

-- 3. Recreate them utilizing the secure, non-recursive function
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING ( public.is_admin() );

CREATE POLICY "user_preferences_select_admin"
  ON public.user_preferences FOR SELECT
  USING ( public.is_admin() );

-- Note: We also apply this fix to any other critical table users hit initially on login
DROP POLICY IF EXISTS "app_settings_select_admin" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_all_admin" ON public.app_settings;

CREATE POLICY "app_settings_select_admin"
  ON public.app_settings FOR SELECT
  USING ( public.is_admin() );

CREATE POLICY "app_settings_all_admin"
  ON public.app_settings FOR ALL
  USING ( public.is_admin() );
