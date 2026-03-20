-- Migration 00014: Add database indexes for performance
-- Indexes on foreign keys and commonly queried columns

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_institution_id ON classes(institution_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);

-- Class teachers/students
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_is_active ON class_students(is_active);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_institution_id ON attendance_sessions(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_session_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);

-- Homework
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON homework(teacher_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_institution_id ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_institution_id ON audit_log(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);