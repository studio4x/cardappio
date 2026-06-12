-- ============================================================
-- CARDAPPIO — Migration 031: Rename Plans to PRO
-- ============================================================
-- 1. Updates subscription_tier check constraint on user_subscriptions
-- 2. Renames existing plans to include "PRO" in name and slug
-- 3. Migrates existing subscriptions/profiles to the new slugs
-- ============================================================

-- 1. Update check constraint
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
    'plano-nutricionista',
    'plano-pro-7-dias',
    'plano-pro-14-dias'
  ));

-- 2. Update existing plans in subscription_plans table
UPDATE public.subscription_plans 
SET 
  name = 'Plano PRO 7 Dias', 
  slug = 'plano-pro-7-dias',
  features = '["Planejamento de até 7 refeições por semana (repetição obrigatória)", "Otimização e economia de tempo", "Lista de compras inteligente", "Acesso PWA completo"]'::jsonb
WHERE slug = 'plano-7-refeicoes';

UPDATE public.subscription_plans 
SET 
  name = 'Plano PRO 14 Dias', 
  slug = 'plano-pro-14-dias',
  features = '["Planejamento de até 14 refeições livres (sem repetição obrigatória)", "Escolha livre de almoço e jantar", "Lista de compras inteligente", "Acesso PWA completo", "Orientação por voz (IA Cozinheira)"]'::jsonb
WHERE slug = 'plano-14-refeicoes';

-- 3. Migrate existing user subscriptions
UPDATE public.user_subscriptions 
SET tier = 'plano-pro-7-dias' 
WHERE tier = 'plano-7-refeicoes';

UPDATE public.user_subscriptions 
SET tier = 'plano-pro-14-dias' 
WHERE tier = 'plano-14-refeicoes';

-- 4. Migrate existing profile tiers
UPDATE public.profiles 
SET subscription_tier = 'plano-pro-7-dias' 
WHERE subscription_tier = 'plano-7-refeicoes';

UPDATE public.profiles 
SET subscription_tier = 'plano-pro-14-dias' 
WHERE subscription_tier = 'plano-14-refeicoes';
