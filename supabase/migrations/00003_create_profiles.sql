-- ============================================================
-- Migration 00003: profiles
-- ============================================================

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  role            TEXT NOT NULL CHECK (role IN ('institution_admin', 'teacher', 'student')),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_institution ON profiles(institution_id);
CREATE INDEX idx_profiles_role ON profiles(institution_id, role);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
