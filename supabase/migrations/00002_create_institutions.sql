-- ============================================================
-- Migration 00002: institutions
-- ============================================================

CREATE TABLE institutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  logo_url          TEXT,
  address           TEXT,
  phone             TEXT,
  email             TEXT,
  subscription_tier TEXT DEFAULT 'free'
                    CHECK (subscription_tier IN ('free', 'starter', 'pro')),
  max_students      INT DEFAULT 100,
  receipt_sequence  INT DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
