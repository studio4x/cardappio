-- ============================================================
-- CARDAPPIO — Migration 037: Add Subscription Cancel Reason
-- ============================================================
-- Adds columns to user_subscriptions to log cancellation details
-- ============================================================

ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
