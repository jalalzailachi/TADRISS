-- ============================================================
-- Migration 00010: Fix Attendance RLS & Class Visibility
-- ============================================================

-- Drop existing attendance_sessions policies
DROP POLICY IF EXISTS "admin_read_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "teacher_manage_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "student_read_own_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Teachers can create attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "attendance_sessions_insert_policy" ON attendance_sessions;

-- INSERT: Teacher can only open a session for a class they are assigned to
CREATE POLICY "teacher_can_insert_attendance_session"
ON attendance_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = attendance_sessions.class_id
      AND p.id = auth.uid()
      AND p.institution_id = get_institution_id()
  )
);

-- SELECT: Teacher sees sessions for their classes; Student sees sessions for their enrolled classes; Admin sees all
CREATE POLICY "select_attendance_sessions"
ON attendance_sessions
FOR SELECT
TO authenticated
USING (
  -- Admin
  get_user_role() = 'institution_admin'
  OR
  -- Teacher assigned to this class
  EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = attendance_sessions.class_id
      AND p.id = auth.uid()
  )
  OR
  -- Student enrolled in this class
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN profiles p ON p.id = cs.student_id
    WHERE cs.class_id = attendance_sessions.class_id
      AND p.id = auth.uid()
  )
);

-- UPDATE/DELETE: Only the teacher who created the session OR admin
CREATE POLICY "teacher_can_update_attendance_session"
ON attendance_sessions
FOR UPDATE
TO authenticated
USING (
  get_user_role() = 'institution_admin'
  OR EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = attendance_sessions.class_id
      AND p.id = auth.uid()
  )
);

-- Fix attendance_records RLS
DROP POLICY IF EXISTS "admin_read_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "teacher_manage_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "student_read_own_attendance_records" ON attendance_records;

-- attendance_records INSERT: Teacher submitting records for their session
CREATE POLICY "teacher_can_insert_attendance_records"
ON attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE s.id = attendance_records.session_id
      AND p.id = auth.uid()
  )
);

-- attendance_records SELECT: Student sees only their own; Teacher sees their class; Admin sees all
CREATE POLICY "select_attendance_records"
ON attendance_records
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'institution_admin'
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = attendance_records.student_id
      AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE s.id = attendance_records.session_id
      AND p.id = auth.uid()
  )
);

-- Classes RLS
DROP POLICY IF EXISTS "classes_select_policy" ON classes;
DROP POLICY IF EXISTS "teacher_read_classes" ON classes;
DROP POLICY IF EXISTS "student_read_classes" ON classes;

CREATE POLICY "all_roles_can_see_their_classes"
ON classes
FOR SELECT
TO authenticated
USING (
  -- Admin sees all classes in their institution
  (get_user_role() = 'institution_admin' AND institution_id = get_institution_id())
  OR
  -- Teacher assigned to this class
  EXISTS (
    SELECT 1 FROM class_teachers ct
    WHERE ct.class_id = classes.id
      AND ct.teacher_id = auth.uid()
  )
  OR
  -- Student enrolled in this class
  EXISTS (
    SELECT 1 FROM class_students cs
    WHERE cs.class_id = classes.id
      AND cs.student_id = auth.uid()
  )
);

-- Add requires_password_change column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;
