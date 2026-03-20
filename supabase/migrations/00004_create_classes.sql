-- ============================================================
-- Migration 00004: classes + junction tables
-- ============================================================

CREATE TABLE classes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  subject         TEXT,
  level           TEXT,
  schedule_days   TEXT[],
  schedule_time   TIME,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_classes_institution ON classes(institution_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Junction: class ↔ teacher
CREATE TABLE class_teachers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);

CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id);
CREATE INDEX idx_class_teachers_institution ON class_teachers(institution_id);

-- Junction: class ↔ student
CREATE TABLE class_students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  enrolled_at     TIMESTAMPTZ DEFAULT now(),
  is_active       BOOLEAN DEFAULT true,
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_students_student ON class_students(student_id);
CREATE INDEX idx_class_students_institution ON class_students(institution_id);
