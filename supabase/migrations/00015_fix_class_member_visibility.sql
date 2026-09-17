-- ============================================================
-- Migration 00015: Fix Class Member Visibility for Students
-- ============================================================

-- Students need to be able to see who their teachers are
-- and how many students are in their classes.

-- Fix class_teachers visibility
DROP POLICY IF EXISTS "teacher_read_own_assignments" ON class_teachers;
CREATE POLICY "select_class_teachers"
ON class_teachers
FOR SELECT
TO authenticated
USING (
  -- Admin
  get_user_role() = 'institution_admin'
  OR
  -- Teacher sees their own assignments
  teacher_id = auth.uid()
  OR
  -- Student sees teachers for classes they are enrolled in
  EXISTS (
    SELECT 1 FROM class_students cs
    WHERE cs.class_id = class_teachers.class_id
      AND cs.student_id = auth.uid()
      AND cs.is_active = true
  )
);

-- Fix class_students visibility
DROP POLICY IF EXISTS "student_read_own_enrollments" ON class_students;
DROP POLICY IF EXISTS "teacher_read_own_class_students" ON class_students;

CREATE POLICY "select_class_students"
ON class_students
FOR SELECT
TO authenticated
USING (
  -- Admin
  get_user_role() = 'institution_admin'
  OR
  -- Teacher sees students in their assigned classes
  EXISTS (
    SELECT 1 FROM class_teachers ct
    WHERE ct.class_id = class_students.class_id
      AND ct.teacher_id = auth.uid()
  )
  OR
  -- Student sees other students in the same classes (for counts/collaboration)
  EXISTS (
    SELECT 1 FROM class_students cs
    WHERE cs.class_id = class_students.class_id
      AND cs.student_id = auth.uid()
      AND cs.is_active = true
  )
);
