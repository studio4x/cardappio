-- ============================================================
-- CARDAPPIO — Migration 016: Subscription Plans Seeds
-- ============================================================
-- Inserts default plans for Cardappio (B2C Only):
-- 1. Plano 7 Refeições B2C (R$ 29/mês)
-- 2. Plano 14 Refeições B2C (R$ 39/mês)
-- ============================================================

INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, trial_days, features, is_active)
VALUES 
(
  'Plano 7 Refeições', 
  'plano-7-refeicoes', 
  'Planeje até 7 refeições semanais com repetição obrigatória (almoço e jantar iguais). Ideal para economizar e otimizar tempo.', 
  29.00, 
  290.00, 
  21, 
  '["7 refeições por semana", "Repetição obrigatória almoço/jantar", "Lista de compras inteligente", "Acesso PWA completo"]'::jsonb,
  true
),
(
  'Plano 14 Refeições', 
  'plano-14-refeicoes', 
  'Planeje até 14 refeições semanais livres (almoço e jantar diferentes). Variedade máxima para sua semana.', 
  39.00, 
  390.00, 
  21, 
  '["14 refeições por semana", "Escolha livre de almoço e jantar", "Lista de compras inteligente", "Acesso PWA completo"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  trial_days = EXCLUDED.trial_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
