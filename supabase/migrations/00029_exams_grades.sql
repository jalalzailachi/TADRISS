-- ============================================================
-- Migration 00029: exams, grades, grading_scales
-- ============================================================

CREATE TABLE exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  subject_text     TEXT,
  academic_term    TEXT,
  name             TEXT NOT NULL,
  exam_date        DATE NOT NULL,
  duration_minutes INT,
  max_score        NUMERIC(6,2) NOT NULL DEFAULT 100,
  weight           NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exams_class_date ON exams(class_id, exam_date DESC);
CREATE INDEX idx_exams_institution ON exams(institution_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE grades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  student_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  exam_id          UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  score            NUMERIC(6,2) NOT NULL,
  comment          TEXT,
  graded_by        UUID REFERENCES profiles(id),
  graded_at        TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, exam_id)
);

CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_exam ON grades(exam_id);
CREATE INDEX idx_grades_institution ON grades(institution_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE grading_scales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT false,
  scale           JSONB NOT NULL DEFAULT '[
    {"letter":"A+","min":90},
    {"letter":"A","min":80},
    {"letter":"B+","min":70},
    {"letter":"B","min":60},
    {"letter":"C","min":50},
    {"letter":"F","min":0}
  ]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grading_scales_institution ON grading_scales(institution_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON grading_scales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_exams" ON exams
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_manage_exams" ON exams
  FOR ALL USING (
    public.get_user_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  ) WITH CHECK (
    public.get_user_role() = 'teacher'
    AND institution_id = public.get_institution_id()
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "student_read_own_exams" ON exams
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND class_id IN (SELECT class_id FROM class_students WHERE student_id = auth.uid() AND is_active = true)
  );

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_grades" ON grades
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_manage_grades" ON grades
  FOR ALL USING (
    public.get_user_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  ) WITH CHECK (
    public.get_user_role() = 'teacher'
    AND institution_id = public.get_institution_id()
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "student_read_own_grades" ON grades
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );

ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_grading_scales" ON grading_scales
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "members_read_grading_scales" ON grading_scales
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() IN ('teacher', 'student')
  );
