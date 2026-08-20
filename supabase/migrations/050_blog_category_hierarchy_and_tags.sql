-- ============================================================
-- CARDAPPIO — Migration 050: Category Hierarchy & Multi-Category
-- ============================================================

-- 1. Add parent_id to blog_categories for hierarchy (Parent -> Subcategory)
ALTER TABLE public.blog_categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blog_categories_parent ON public.blog_categories(parent_id);

-- 2. Create blog_post_categories join table for multiple categories per post
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_post_categories_post ON public.blog_post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category ON public.blog_post_categories(category_id);

-- 3. Enable RLS on blog_post_categories
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_post_categories_select_public" ON public.blog_post_categories;
CREATE POLICY "blog_post_categories_select_public"
  ON public.blog_post_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_post_categories_admin_all" ON public.blog_post_categories;
CREATE POLICY "blog_post_categories_admin_all"
  ON public.blog_post_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 4. Backfill existing single category_id into blog_post_categories
INSERT INTO public.blog_post_categories (post_id, category_id)
SELECT id, category_id FROM public.blog_posts WHERE category_id IS NOT NULL
ON CONFLICT (post_id, category_id) DO NOTHING;
