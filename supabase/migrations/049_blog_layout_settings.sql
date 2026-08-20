-- ============================================================
-- CARDAPPIO — Migration 049: Blog Layout & Sidebar Sliders
-- ============================================================

-- 1. Ensure blog_layout setting key is readable by public
DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;

CREATE POLICY "app_settings_select_public"
ON public.app_settings FOR SELECT
USING (
  setting_key IN ('visual_identity', 'public_config', 'blog_layout')
);

-- 2. Seed initial blog_layout configuration
INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'blog_layout',
  '{
    "hero_title": "Blog Cardappio",
    "hero_subtitle": "Dicas, planejamento e receitas para organizar sua rotina na cozinha com praticidade.",
    "sidebar_blocks": [
      {
        "id": "block-1",
        "mode": "carousel",
        "block_type": "card_text",
        "slides": [
          {
            "id": "slide-1",
            "badge_text": "CARDAPPIO PRO",
            "title": "Organize sua semana alimentar sem complicação",
            "description": "Crie seu cardápio semanal personalizado, gere listas de compras automáticas e economize tempo na cozinha.",
            "bullet_points": [
              "Planejador semanal inteligente",
              "Centenas de receitas fáceis"
            ],
            "cta_button_text": "Começar Grátis",
            "cta_link_url": "/auth/cadastro",
            "theme": "dark"
          },
          {
            "id": "slide-2",
            "badge_text": "RECEITAS EXCLUSIVAS",
            "title": "Receitas práticas e nutritivas para toda a família",
            "description": "Acesse nosso acervo completo com informações nutricionais detalhadas para cada refeição.",
            "bullet_points": [
              "Opções low carb e vegetarianas",
              "Cálculo automático de calorias"
            ],
            "cta_button_text": "Conhecer Receitas",
            "cta_link_url": "/receitas",
            "theme": "emerald"
          }
        ]
      }
    ]
  }'::jsonb,
  'Configurações de cabeçalho hero e blocos/sliders de lateral do blog'
)
ON CONFLICT (setting_key) DO NOTHING;
