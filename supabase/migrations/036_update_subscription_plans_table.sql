-- ============================================================
-- CARDAPPIO — Migration 036: Update Subscription Plans Prices and Features
-- ============================================================
-- Updates subscription_plans table to reflect:
-- 1. 15-day PRO trial on signup
-- 2. 1 day/week limit for Plano Gratuito (post-trial)
-- 3. Updated pricing and feature lists for PRO 7 and PRO 14 plans
-- ============================================================

-- 1. Update Plano Gratuito
UPDATE public.subscription_plans 
SET 
  name = 'Plano Gratuito',
  description = 'Ativado após o término dos 15 dias de degustação PRO.',
  price_monthly = 0.00,
  price_yearly = 0.00,
  trial_days = 0,
  features = '["Planejamento de 1 dia liberado por semana", "Acesso a receitas básicas gratuitas", "Lista de compras básica do dia liberado", "Acesso contínuo sem custo"]'::jsonb,
  is_active = true
WHERE slug IN ('plano-gratuito', 'free');

-- 2. Update Plano PRO 7 Dias
UPDATE public.subscription_plans 
SET 
  name = 'Plano PRO 7 Dias',
  description = 'Para quem quer planejar a semana inteira com praticidade.',
  price_monthly = 14.90,
  price_yearly = 149.00,
  trial_days = 0,
  features = '["Planejamento de 7 dias por semana", "2 refeições por dia (Almoço e Jantar)", "Catálogo de Receitas PRO liberado", "Lista de compras inteligente automatizada", "Suporte prioritário"]'::jsonb,
  is_active = true
WHERE slug IN ('plano-pro-7-dias', 'plano-7-refeicoes');

-- 3. Update Plano PRO 14 Dias
UPDATE public.subscription_plans 
SET 
  name = 'Plano PRO 14 Dias',
  description = 'Liberdade total e recursos de inteligência de voz. Inclui 15 dias de degustação grátis no cadastro!',
  price_monthly = 24.90,
  price_yearly = 249.00,
  trial_days = 15,
  features = '["15 dias de degustação PRO GRÁTIS ao se cadastrar", "Planejamento de até 14 dias (2 semanas)", "Refeições e cardápios ilimitados por dia", "Orientação por Voz com Assistente de IA", "Catálogo completo de receitas e coleções", "Lista de compras automatizada"]'::jsonb,
  is_active = true
WHERE slug IN ('plano-pro-14-dias', 'plano-14-refeicoes', 'pro');
