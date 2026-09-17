-- Ensure core columns exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 30;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Safe cascade delete function for classes
CREATE OR REPLACE FUNCTION delete_class_cascade(
  p_class_id uuid,
  p_institution_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id AND institution_id = p_institution_id
  ) THEN
    RAISE EXCEPTION 'Class not found or unauthorized';
  END IF;

  DELETE FROM attendance_records WHERE session_id IN (
    SELECT id FROM attendance_sessions WHERE class_id = p_class_id
  );
  DELETE FROM attendance_sessions WHERE class_id = p_class_id;
  DELETE FROM homework WHERE class_id = p_class_id;
  DELETE FROM class_students WHERE class_id = p_class_id;
  DELETE FROM class_teachers WHERE class_id = p_class_id;
  DELETE FROM classes WHERE id = p_class_id AND institution_id = p_institution_id;
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_classes_institution_id ON classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);

-- Drop all existing class policies to start clean
DROP POLICY IF EXISTS "classes_select_policy" ON classes;
DROP POLICY IF EXISTS "classes_insert_policy" ON classes;
DROP POLICY IF EXISTS "classes_update_policy" ON classes;
DROP POLICY IF EXISTS "classes_delete_policy" ON classes;
DROP POLICY IF EXISTS "admin_all_classes" ON classes;
DROP POLICY IF EXISTS "teacher_select_classes" ON classes;
DROP POLICY IF EXISTS "student_select_classes" ON classes;

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Admin: full CRUD on their institution's classes
CREATE POLICY "admin_all_classes" ON classes
FOR ALL TO authenticated
USING (
  institution_id = get_institution_id()
  AND get_user_role() = 'institution_admin'
)
WITH CHECK (
  institution_id = get_institution_id()
  AND get_user_role() = 'institution_admin'
);

-- Teacher: select classes they are assigned to
CREATE POLICY "teacher_select_classes" ON classes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = classes.id
      AND p.id = auth.uid()
  )
);

-- Student: select classes they are enrolled in
CREATE POLICY "student_select_classes" ON classes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN profiles p ON p.id = cs.student_id
    WHERE cs.class_id = classes.id
      AND p.id = auth.uid()
  )
);
