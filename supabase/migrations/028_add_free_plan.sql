-- ============================================================
-- CARDAPPIO — Migration 028: Add Free Plan
-- ============================================================
-- Inserts the Plano Gratuito (Free Plan) B2C into the subscription_plans table.

INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, trial_days, features, is_active)
VALUES (
  'Plano Gratuito',
  'plano-gratuito',
  'Perfeito para quem está começando a se organizar. Planeje refeições básicas com limitações.',
  0.00,
  0.00,
  0,
  '["Planejamento de até 3 dias/semana", "Acesso a 50 receitas básicas", "Lista de compras básica", "1 perfil de usuário"]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;
