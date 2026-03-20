-- ============================================================
-- Migration 00006: homework
-- ============================================================

CREATE TABLE homework (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  teacher_id      UUID NOT NULL REFERENCES profiles(id),
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  file_url        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_homework_class ON homework(class_id);
CREATE INDEX idx_homework_class_due ON homework(class_id, due_date);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON homework
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
