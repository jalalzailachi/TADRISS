-- ============================================================
-- Migration 00013: Security Hardening
-- ============================================================

-- 1. ADD MISSING DELETE POLICIES

-- attendance_sessions DELETE
CREATE POLICY "teacher_can_delete_own_attendance_session"
ON attendance_sessions
FOR DELETE
TO authenticated
USING (
  get_user_role() = 'institution_admin'
  OR EXISTS (
    SELECT 1 FROM class_teachers ct
    WHERE ct.class_id = attendance_sessions.class_id
      AND ct.teacher_id = auth.uid()
  )
);

-- attendance_records DELETE
CREATE POLICY "teacher_can_delete_attendance_records"
ON attendance_records
FOR DELETE
TO authenticated
USING (
  get_user_role() = 'institution_admin'
  OR EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND ct.teacher_id = auth.uid()
  )
);

-- 2. HARDEN HOMEWORK POLICIES
-- Scoping homework to institution_id for all operations

DROP POLICY IF EXISTS "teacher_manage_homework" ON homework;

CREATE POLICY "teacher_manage_homework" ON homework
FOR ALL
TO authenticated
USING (
  (get_user_role() = 'teacher' AND teacher_id = auth.uid() AND institution_id = get_institution_id())
  OR (get_user_role() = 'institution_admin' AND institution_id = get_institution_id())
)
WITH CHECK (
  (get_user_role() = 'teacher' AND teacher_id = auth.uid() AND institution_id = get_institution_id())
  OR (get_user_role() = 'institution_admin' AND institution_id = get_institution_id())
);

-- 3. HARDEN CLASS MANAGEMENT
DROP POLICY IF EXISTS "admin_manage_classes" ON classes;
CREATE POLICY "admin_manage_classes" ON classes
FOR ALL 
TO authenticated
USING (
  institution_id = get_institution_id()
  AND get_user_role() = 'institution_admin'
)
WITH CHECK (
  institution_id = get_institution_id()
  AND get_user_role() = 'institution_admin'
);

-- 4. HARDEN PROFILE SELECTION
-- Ensure students can only see profiles in their own institution
DROP POLICY IF EXISTS "user_read_self" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT
TO authenticated
USING (
  institution_id = get_institution_id()
);
