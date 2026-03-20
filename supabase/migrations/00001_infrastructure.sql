-- ============================================================
-- Migration 00001: Shared infrastructure
-- Trigger function + RLS helper functions
-- ============================================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS helper: get institution_id from JWT (zero queries)
CREATE OR REPLACE FUNCTION public.get_institution_id()
RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'institution_id')::UUID
$$ LANGUAGE sql STABLE;

-- RLS helper: get user role from JWT (zero queries)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb
    -> 'app_metadata' ->> 'role'
$$ LANGUAGE sql STABLE;
