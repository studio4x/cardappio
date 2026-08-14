-- ============================================================
-- CARDAPPIO — Migration 046: Blog System (Categories, Posts, Comments)
-- ============================================================

-- 1. Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_active ON public.blog_categories(is_active);

-- 2. Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  seo_description TEXT,
  cover_image_url TEXT,
  read_time_minutes INT DEFAULT 5,
  author_name TEXT DEFAULT 'Equipe Cardappio',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  content_text TEXT[],
  content_html TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published_at DESC);

-- 3. Create blog_comments table
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_slug ON public.blog_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON public.blog_comments(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
DROP POLICY IF EXISTS "blog_categories_select_public" ON public.blog_categories;
CREATE POLICY "blog_categories_select_public"
  ON public.blog_categories FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "blog_categories_all_admin" ON public.blog_categories;
CREATE POLICY "blog_categories_all_admin"
  ON public.blog_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for blog_posts
DROP POLICY IF EXISTS "blog_posts_select_public" ON public.blog_posts;
CREATE POLICY "blog_posts_select_public"
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published' 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR auth.uid() = author_id
  );

DROP POLICY IF EXISTS "blog_posts_all_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_all_admin"
  ON public.blog_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- RLS Policies for blog_comments
DROP POLICY IF EXISTS "blog_comments_select_approved" ON public.blog_comments;
CREATE POLICY "blog_comments_select_approved"
  ON public.blog_comments FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "blog_comments_insert_public" ON public.blog_comments;
CREATE POLICY "blog_comments_insert_public"
  ON public.blog_comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "blog_comments_all_admin" ON public.blog_comments;
CREATE POLICY "blog_comments_all_admin"
  ON public.blog_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Seed default categories for Cardappio
INSERT INTO public.blog_categories (name, slug, description, sort_order)
VALUES 
  ('Dicas de Nutrição', 'dicas-de-nutricao', 'Artigos sobre alimentação saudável e rotina alimentar.', 1),
  ('Planejamento Semanal', 'planejamento-semanal', 'Estratégias para organizar as refeições da semana.', 2),
  ('Economia Doméstica', 'economia-domestica', 'Como reduzir o desperdício e economizar nas compras.', 3),
  ('Receitas Rápidas', 'receitas-rapidas', 'Preparações fácil e práticas para o dia a dia.', 4)
ON CONFLICT (slug) DO NOTHING;
