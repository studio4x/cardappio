-- ============================================================
-- CARDAPPIO — Migration 048: Blog Tags & Tag Relations
-- ============================================================

-- 1. Create blog_tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);

-- 2. Create blog_post_tags join table
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON public.blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON public.blog_post_tags(tag_id);

-- 3. Enable RLS
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_tags_select_public" ON public.blog_tags;
CREATE POLICY "blog_tags_select_public"
  ON public.blog_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_tags_admin_all" ON public.blog_tags;
CREATE POLICY "blog_tags_admin_all"
  ON public.blog_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "blog_post_tags_select_public" ON public.blog_post_tags;
CREATE POLICY "blog_post_tags_select_public"
  ON public.blog_post_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_post_tags_admin_all" ON public.blog_post_tags;
CREATE POLICY "blog_post_tags_admin_all"
  ON public.blog_post_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Seed initial tags for Cardappio
INSERT INTO public.blog_tags (name, slug, description)
VALUES 
  ('Alimentação Saudável', 'alimentacao-saudavel', 'Dicas e hábitos para ter uma vida mais equilibrada.'),
  ('Marmitas & Prep', 'marmitas-and-prep', 'Como preparar refeições para a semana toda.'),
  ('Dicas de Cozinha', 'dicas-de-cozinha', 'Truques práticos para facilitar a rotina na cozinha.'),
  ('Economia', 'economia', 'Estratégias para gastar menos nas compras do mercado.')
ON CONFLICT (slug) DO NOTHING;
