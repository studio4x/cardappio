-- ============================================================
-- Migration 015: Admin Profile Management
-- ============================================================

-- Allow admins to update any profile (essential for role management and status updates)
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING ( public.is_admin() );

-- Ensure admins can delete profiles if necessary
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING ( public.is_admin() );
