-- Run this in your Supabase SQL editor (https://supabase.com → SQL Editor)

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT        NOT NULL,
  title       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  image_url   TEXT        NOT NULL DEFAULT '',
  favicon_url TEXT        NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  category    TEXT        NOT NULL DEFAULT 'general',
  source      TEXT        NOT NULL DEFAULT 'web',
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast search/filter
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_category   ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_tags       ON items USING GIN (tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_items_fts ON items
  USING GIN (to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(url, '') || ' ' ||
    COALESCE(notes, '')
  ));

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

-- IMPORTANT: Disable Row Level Security since we use the service key from server functions
-- (Your functions run server-side so only you can access the data)
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
