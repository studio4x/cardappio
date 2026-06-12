-- ============================================================
-- CARDAPPIO — Migration 033: Update Plans Features
-- ============================================================
-- Updates features array for PRO 7 and PRO 14 plans to list all 
-- active PRO benefits.
-- ============================================================

UPDATE public.subscription_plans 
SET 
  features = '["Planejamento Semanal Completo (até 7 refeições/semana com repetição)", "Catálogo de Receitas Premium", "Lista de Compras Inteligente", "Filtros Avançados e Preferências", "Suporte Prioritário", "Otimização e economia de tempo"]'::jsonb
WHERE slug = 'plano-pro-7-dias';

UPDATE public.subscription_plans 
SET 
  features = '["Planejamento Semanal Completo (até 14 refeições livres sem repetição)", "Catálogo de Receitas Premium", "Lista de Compras Inteligente", "Filtros Avançados e Preferências", "Orientação por Voz (IA Cozinheira)", "Suporte Prioritário"]'::jsonb
WHERE slug = 'plano-pro-14-dias';
