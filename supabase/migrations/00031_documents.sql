-- ============================================================
-- Migration 00031: documents + storage bucket
-- ============================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  student_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       TEXT,
  size_bytes      BIGINT,
  category        TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_institution ON documents(institution_id, uploaded_at DESC);
CREATE INDEX idx_documents_student ON documents(student_id);

-- Storage bucket (private; signed URL access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_documents" ON documents
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_read_institution_documents" ON documents
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'teacher'
  );

CREATE POLICY "teacher_upload_documents" ON documents
  FOR INSERT WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'teacher'
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "student_read_own_documents" ON documents
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );
