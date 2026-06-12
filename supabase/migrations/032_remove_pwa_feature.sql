-- ============================================================
-- CARDAPPIO — Migration 032: Remove PWA Feature from Plans
-- ============================================================
-- Removes the redundant "Acesso PWA completo" feature from the 
-- features arrays in the subscription_plans table.
-- ============================================================

UPDATE public.subscription_plans 
SET 
  features = '["Planejamento de até 7 refeições por semana (repetição obrigatória)", "Otimização e economia de tempo", "Lista de compras inteligente"]'::jsonb
WHERE slug = 'plano-pro-7-dias';

UPDATE public.subscription_plans 
SET 
  features = '["Planejamento de até 14 refeições livres (sem repetição obrigatória)", "Escolha livre de almoço e jantar", "Lista de compras inteligente", "Orientação por voz (IA Cozinheira)"]'::jsonb
WHERE slug = 'plano-pro-14-dias';
