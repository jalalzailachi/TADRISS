-- ============================================================
-- Migration 00005: attendance
-- ============================================================

CREATE TABLE attendance_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  teacher_id      UUID NOT NULL REFERENCES profiles(id),
  session_date    DATE NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  notes           TEXT
  -- No UNIQUE(class_id, session_date) — allows multiple sessions per day
);

CREATE INDEX idx_att_sessions_class ON attendance_sessions(class_id);
CREATE INDEX idx_att_sessions_date ON attendance_sessions(session_date);
CREATE INDEX idx_att_sessions_inst_date ON attendance_sessions(institution_id, session_date);

CREATE TABLE attendance_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE RESTRICT,
  student_id  UUID NOT NULL REFERENCES profiles(id),
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_att_records_student ON attendance_records(student_id);
CREATE INDEX idx_att_records_session_status ON attendance_records(session_id, status);
