-- ============================================================
-- Migration 00032: periods + schedules
-- ============================================================

CREATE TABLE periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_periods_institution ON periods(institution_id, sort_order);

CREATE TABLE schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  period_id       UUID NOT NULL REFERENCES periods(id) ON DELETE RESTRICT,
  day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  subject_text    TEXT,
  teacher_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  room            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, period_id, day_of_week)
);

CREATE INDEX idx_schedules_class_day ON schedules(class_id, day_of_week);
CREATE INDEX idx_schedules_teacher ON schedules(teacher_id);
CREATE INDEX idx_schedules_institution ON schedules(institution_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-seed 7 default periods per institution on creation
CREATE OR REPLACE FUNCTION seed_default_periods()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO periods (institution_id, name, start_time, end_time, sort_order) VALUES
    (NEW.id, 'Period 1', '08:00', '08:55', 1),
    (NEW.id, 'Period 2', '09:00', '09:55', 2),
    (NEW.id, 'Period 3', '10:00', '10:55', 3),
    (NEW.id, 'Period 4', '11:00', '11:55', 4),
    (NEW.id, 'Period 5', '12:00', '12:55', 5),
    (NEW.id, 'Period 6', '13:00', '13:55', 6),
    (NEW.id, 'Period 7', '14:00', '14:55', 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_default_periods
  AFTER INSERT ON institutions
  FOR EACH ROW EXECUTE FUNCTION seed_default_periods();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_periods" ON periods
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "members_read_periods" ON periods
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() IN ('teacher', 'student')
  );

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_schedules" ON schedules
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_read_own_schedules" ON schedules
  FOR SELECT USING (
    public.get_user_role() = 'teacher'
    AND (
      teacher_id = auth.uid()
      OR class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
    )
  );

CREATE POLICY "student_read_enrolled_schedules" ON schedules
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND class_id IN (SELECT class_id FROM class_students WHERE student_id = auth.uid() AND is_active = true)
  );
