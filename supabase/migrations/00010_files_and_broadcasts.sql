-- ============================================================
-- Migration 00010: Broadcasts and Storage
-- ============================================================

-- Create a table for broadcast messages
CREATE TABLE broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  role_target     TEXT, -- e.g. 'all', 'student', 'teacher'
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_broadcasts_inst ON broadcasts(institution_id, created_at DESC);

-- Enable RLS
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Everyone in the institution can view broadcasts
CREATE POLICY "Institutions can view their broadcasts"
  ON broadcasts FOR SELECT
  USING (institution_id = get_institution_id());

-- Only admins/teachers can insert
CREATE POLICY "Admins and teachers can insert broadcasts"
  ON broadcasts FOR INSERT
  WITH CHECK (
    institution_id = get_institution_id() AND
    get_user_role() IN ('institution_admin', 'teacher')
  );

-- Storage bucket for homework files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homework', 'homework', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view homework files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'homework');

CREATE POLICY "Authenticated users can upload homework files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'homework' 
    AND auth.role() = 'authenticated'
  );
