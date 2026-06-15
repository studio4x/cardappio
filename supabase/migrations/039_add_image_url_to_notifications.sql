-- ============================================================
-- CARDAPPIO — Migration 039: Add Image URL to Notifications
-- ============================================================

ALTER TABLE public.notifications
ADD COLUMN image_url TEXT;
