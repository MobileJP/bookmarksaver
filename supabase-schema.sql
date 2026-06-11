-- ============================================================
-- Run this in Supabase SQL Editor (https://supabase.com → SQL Editor)
-- ============================================================

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  title       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  image_url   TEXT        NOT NULL DEFAULT '',
  favicon_url TEXT        NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  category    TEXT        NOT NULL DEFAULT 'general',
  source      TEXT        NOT NULL DEFAULT 'web',
  notes       TEXT        NOT NULL DEFAULT '',
  progress    TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id    ON items (user_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_category   ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_tags       ON items USING GIN (tags);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access their own items
CREATE POLICY "Users manage own items" ON items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: if you already have items saved without user_id,
-- run this AFTER your first Google sign-in, replacing the UUID
-- with your actual user ID from Supabase → Authentication → Users
-- ============================================================
-- UPDATE items SET user_id = 'YOUR-USER-UUID-HERE' WHERE user_id IS NULL;
