-- ============================================================
-- Migration 00009: Row Level Security policies (all tables)
-- ============================================================

-- ===== institutions =====
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_institution" ON institutions
  FOR ALL USING (
    id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

-- ===== profiles =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_profiles" ON profiles
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "user_read_self" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "teacher_read_class_students" ON profiles
  FOR SELECT USING (
    public.get_user_role() = 'teacher'
    AND role = 'student'
    AND id IN (
      SELECT cs.student_id FROM class_students cs
      JOIN class_teachers ct ON cs.class_id = ct.class_id
      WHERE ct.teacher_id = auth.uid() AND cs.is_active = true
    )
  );

-- ===== classes =====
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_classes" ON classes
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_read_classes" ON classes
  FOR SELECT USING (
    public.get_user_role() = 'teacher'
    AND id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "student_read_classes" ON classes
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND id IN (SELECT class_id FROM class_students WHERE student_id = auth.uid() AND is_active = true)
  );

-- ===== class_teachers =====
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_class_teachers" ON class_teachers
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_read_own_assignments" ON class_teachers
  FOR SELECT USING (
    public.get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
  );

-- ===== class_students =====
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_class_students" ON class_students
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_read_own_class_students" ON class_students
  FOR SELECT USING (
    public.get_user_role() = 'teacher'
    AND class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY "student_read_own_enrollments" ON class_students
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );

-- ===== attendance_sessions =====
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_attendance_sessions" ON attendance_sessions
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_manage_attendance_sessions" ON attendance_sessions
  FOR ALL USING (
    public.get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
  ) WITH CHECK (
    public.get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
    AND institution_id = public.get_institution_id()
  );

CREATE POLICY "student_read_own_attendance_sessions" ON attendance_sessions
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND class_id IN (SELECT class_id FROM class_students WHERE student_id = auth.uid() AND is_active = true)
  );

-- ===== attendance_records =====
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_attendance_records" ON attendance_records
  FOR SELECT USING (
    public.get_user_role() = 'institution_admin'
    AND session_id IN (
      SELECT id FROM attendance_sessions WHERE institution_id = public.get_institution_id()
    )
  );

CREATE POLICY "teacher_manage_attendance_records" ON attendance_records
  FOR ALL USING (
    public.get_user_role() = 'teacher'
    AND session_id IN (SELECT id FROM attendance_sessions WHERE teacher_id = auth.uid())
  ) WITH CHECK (
    public.get_user_role() = 'teacher'
    AND session_id IN (SELECT id FROM attendance_sessions WHERE teacher_id = auth.uid())
  );

CREATE POLICY "student_read_own_attendance_records" ON attendance_records
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );

-- ===== homework =====
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_homework" ON homework
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "teacher_manage_homework" ON homework
  FOR ALL USING (
    public.get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
  ) WITH CHECK (
    public.get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
    AND institution_id = public.get_institution_id()
  );

CREATE POLICY "student_read_enrolled_homework" ON homework
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND class_id IN (SELECT class_id FROM class_students WHERE student_id = auth.uid() AND is_active = true)
  );

-- ===== enrollment_fees =====
ALTER TABLE enrollment_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_enrollment_fees" ON enrollment_fees
  FOR ALL USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "student_read_own_fees" ON enrollment_fees
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );

-- ===== payments (append-only) =====
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_insert_payments" ON payments
  FOR INSERT WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

CREATE POLICY "admin_read_payments" ON payments
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );
-- No UPDATE/DELETE policy — payments are immutable via client
-- Voiding done through Edge Function with service role

CREATE POLICY "student_read_own_payments" ON payments
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND student_id = auth.uid()
  );

-- ===== receipts =====
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_receipts" ON receipts
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );
-- INSERT done via Edge Function (service role)

CREATE POLICY "student_read_own_receipts" ON receipts
  FOR SELECT USING (
    public.get_user_role() = 'student'
    AND payment_id IN (SELECT id FROM payments WHERE student_id = auth.uid())
  );

-- ===== audit_log (no access for regular users) =====
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No policies = zero access for authenticated users
-- Writes via SECURITY DEFINER triggers
-- Reads via service role key only
