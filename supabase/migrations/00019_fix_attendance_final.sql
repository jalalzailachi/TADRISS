-- Drop all attendance policies and rebuild clean
DROP POLICY IF EXISTS "teacher_can_insert_attendance_session" ON attendance_sessions;
DROP POLICY IF EXISTS "teacher_insert_session" ON attendance_sessions;
DROP POLICY IF EXISTS "select_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "select_attendance_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "teacher_can_update_attendance_session" ON attendance_sessions;
DROP POLICY IF EXISTS "teacher_insert_records" ON attendance_records;
DROP POLICY IF EXISTS "teacher_can_insert_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "select_records" ON attendance_records;
DROP POLICY IF EXISTS "select_attendance_records" ON attendance_records;

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- attendance_sessions: admin full access
CREATE POLICY "admin_attendance_sessions" ON attendance_sessions
FOR ALL TO authenticated
USING (
  get_user_role() = 'institution_admin'
  AND EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendance_sessions.class_id
    AND c.institution_id = get_institution_id()
  )
)
WITH CHECK (
  get_user_role() = 'institution_admin'
  AND EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendance_sessions.class_id
    AND c.institution_id = get_institution_id()
  )
);

-- attendance_sessions: teacher INSERT for their assigned classes
CREATE POLICY "teacher_insert_attendance_sessions" ON attendance_sessions
FOR INSERT TO authenticated
WITH CHECK (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = attendance_sessions.class_id
    AND p.id = auth.uid()
  )
);

-- attendance_sessions: teacher SELECT their classes
CREATE POLICY "teacher_select_attendance_sessions" ON attendance_sessions
FOR SELECT TO authenticated
USING (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1 FROM class_teachers ct
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE ct.class_id = attendance_sessions.class_id
    AND p.id = auth.uid()
  )
);

-- attendance_sessions: student SELECT their enrolled classes
CREATE POLICY "student_select_attendance_sessions" ON attendance_sessions
FOR SELECT TO authenticated
USING (
  get_user_role() = 'student'
  AND EXISTS (
    SELECT 1 FROM class_students cs
    JOIN profiles p ON p.id = cs.student_id
    WHERE cs.class_id = attendance_sessions.class_id
    AND p.id = auth.uid()
  )
);

-- attendance_records: admin full access
CREATE POLICY "admin_attendance_records" ON attendance_records
FOR ALL TO authenticated
USING (
  get_user_role() = 'institution_admin'
  AND EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
    AND c.institution_id = get_institution_id()
  )
)
WITH CHECK (
  get_user_role() = 'institution_admin'
  AND EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
    AND c.institution_id = get_institution_id()
  )
);

-- attendance_records: teacher INSERT for their sessions
CREATE POLICY "teacher_insert_attendance_records" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE s.id = attendance_records.session_id
    AND p.id = auth.uid()
  )
);

-- attendance_records: teacher SELECT their class records
CREATE POLICY "teacher_select_attendance_records" ON attendance_records
FOR SELECT TO authenticated
USING (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE s.id = attendance_records.session_id
    AND p.id = auth.uid()
  )
);

-- attendance_records: student SELECT own records
CREATE POLICY "student_select_own_records" ON attendance_records
FOR SELECT TO authenticated
USING (
  get_user_role() = 'student'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = attendance_records.student_id
    AND p.id = auth.uid()
  )
);

-- attendance_records: teacher UPDATE (to correct mistakes)
CREATE POLICY "teacher_update_attendance_records" ON attendance_records
FOR UPDATE TO authenticated
USING (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1 FROM attendance_sessions s
    JOIN class_teachers ct ON ct.class_id = s.class_id
    JOIN profiles p ON p.id = ct.teacher_id
    WHERE s.id = attendance_records.session_id
    AND p.id = auth.uid()
  )
);
