-- ============================================================
-- CARDAPPIO — Migration 047: Blog Advanced SEO, Schedule & Revisions
-- ============================================================

-- 1. Add advanced fields to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS card_image_url TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_robots TEXT DEFAULT 'index, follow',
  ADD COLUMN IF NOT EXISTS seo_og_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_og_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Adjust status check constraint to include 'scheduled'
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Index for scheduled posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled ON public.blog_posts(scheduled_publish_at) WHERE status = 'scheduled';

-- 2. Create blog_revisions table for article version control
CREATE TABLE IF NOT EXISTS public.blog_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  change_type TEXT DEFAULT 'update',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_revisions_post ON public.blog_revisions(post_id);

-- Enable RLS for blog_revisions
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_revisions_admin_all" ON public.blog_revisions;
CREATE POLICY "blog_revisions_admin_all"
  ON public.blog_revisions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
