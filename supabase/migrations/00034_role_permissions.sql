-- ============================================================
-- Migration 00034: role_permissions matrix (per-institution
-- fine-grained page visibility for teacher/student roles).
-- ============================================================

CREATE TABLE role_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('institution_admin', 'teacher', 'student')),
  page_key        TEXT NOT NULL,
  can_view        BOOLEAN NOT NULL DEFAULT true,
  can_edit        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, role, page_key)
);

CREATE INDEX idx_role_permissions_lookup
  ON role_permissions(institution_id, role);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Plain function (not trigger) that seeds default permissions
-- for one institution. Called by both the trigger and the backfill.
CREATE OR REPLACE FUNCTION seed_role_permissions_for_institution(inst_id UUID)
RETURNS VOID AS $$
BEGIN
  -- institution_admin: full access to everything
  INSERT INTO role_permissions (institution_id, role, page_key, can_view, can_edit)
  SELECT inst_id, 'institution_admin', pk, true, true FROM unnest(ARRAY[
    'dashboard','students','teachers','classes','attendance','grades',
    'schedule','finance','messages','announcements','documents','settings'
  ]) AS pk
  ON CONFLICT (institution_id, role, page_key) DO NOTHING;

  -- teacher: core teaching pages
  INSERT INTO role_permissions (institution_id, role, page_key, can_view, can_edit)
  SELECT inst_id, 'teacher', pk, true, ed FROM (VALUES
    ('dashboard', false),
    ('classes',   false),
    ('attendance',true),
    ('grades',    true),
    ('schedule',  false),
    ('homework',  true),
    ('messages',  true),
    ('announcements', false),
    ('documents', false)
  ) AS t(pk, ed)
  ON CONFLICT (institution_id, role, page_key) DO NOTHING;

  -- student: read-only self pages
  INSERT INTO role_permissions (institution_id, role, page_key, can_view, can_edit)
  SELECT inst_id, 'student', pk, true, false FROM unnest(ARRAY[
    'dashboard','classes','attendance','grades','homework','payments','messages','announcements','documents'
  ]) AS pk
  ON CONFLICT (institution_id, role, page_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger wrapper
CREATE OR REPLACE FUNCTION trg_seed_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_role_permissions_for_institution(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_default_role_permissions
  AFTER INSERT ON institutions
  FOR EACH ROW EXECUTE FUNCTION trg_seed_role_permissions();

-- Backfill for existing institutions
DO $$
DECLARE
  inst RECORD;
BEGIN
  FOR inst IN SELECT id FROM institutions LOOP
    PERFORM seed_role_permissions_for_institution(inst.id);
  END LOOP;
END $$;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_role_permissions" ON role_permissions
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "members_read_role_permissions" ON role_permissions
  FOR SELECT USING (
    institution_id = public.get_institution_id()
  );

CREATE POLICY "super_admin_read_role_permissions" ON role_permissions
  FOR SELECT USING (public.is_super_admin());
