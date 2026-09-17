-- ============================================================
-- Migration 00033: extend broadcasts for announcements
-- Adds is_pinned and audience columns used by the
-- /dashboard/announcements feed.
-- ============================================================

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS is_pinned  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audience   TEXT DEFAULT 'all'
    CHECK (audience IN ('all', 'teachers', 'students', 'parents'));

CREATE INDEX IF NOT EXISTS idx_broadcasts_pinned
  ON broadcasts(institution_id, is_pinned DESC, created_at DESC);

-- Backfill NULL role_target rows with audience='all'
UPDATE broadcasts SET audience = 'all' WHERE audience IS NULL;

-- Allow admins to UPDATE and DELETE (original migration only had SELECT + INSERT)
CREATE POLICY "admin_update_broadcasts" ON broadcasts
  FOR UPDATE USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "admin_delete_broadcasts" ON broadcasts
  FOR DELETE USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );
