-- ============================================================
-- CARDAPPIO — Migration 017: Add Subscription Fields to Profiles
-- ============================================================
-- 1. Add subscription columns to profiles table
-- 2. Create sync trigger to automatically propagate updates
-- ============================================================

-- 1. Add columns with defaults
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMPTZ;

-- 2. Create index for performance on subscription checks
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- 3. Create sync function
CREATE OR REPLACE FUNCTION public.sync_user_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET subscription_tier = 'free',
        subscription_until = NULL
    WHERE id = OLD.user_id;
  ELSE
    IF NEW.status IN ('active', 'trialing') THEN
      UPDATE public.profiles
      SET subscription_tier = NEW.tier,
          subscription_until = NEW.current_period_end
      WHERE id = NEW.user_id;
    ELSE
      UPDATE public.profiles
      SET subscription_tier = 'free',
          subscription_until = NULL
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_sync_user_subscription_to_profile ON public.user_subscriptions;
CREATE TRIGGER trg_sync_user_subscription_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_subscription_to_profile();
