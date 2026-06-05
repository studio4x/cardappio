-- ============================================================
-- CARDAPPIO — Migration 029: Alter Subscription Tier Constraint
-- ============================================================
-- Drops the old check constraint limiting tiers to free/premium/gold
-- and adds an updated check constraint that supports the custom plans.

ALTER TABLE public.user_subscriptions 
  DROP CONSTRAINT IF EXISTS user_subscriptions_tier_check;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_tier_check 
  CHECK (tier IN (
    'free', 
    'premium', 
    'gold', 
    'plano-7-refeicoes', 
    'plano-14-refeicoes', 
    'plano-gratuito', 
    'pro', 
    'plano-nutricionista'
  ));
