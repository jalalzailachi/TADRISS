import { z } from 'zod';

// ----- Institution -----
export const institutionSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

// ----- Profile -----
export const profileSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
});

export const inviteTeacherSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
});

// ----- Class -----
export const classSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().max(100).optional().or(z.literal('')),
  level: z.string().max(100).optional().or(z.literal('')),
  schedule_days: z.array(z.string()).optional(),
  schedule_time: z.string().optional().or(z.literal('')),
});

// ----- Attendance -----
export const attendanceRecordSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late']),
});

export const attendanceSessionSchema = z.object({
  class_id: z.string().uuid(),
  session_date: z.string(),
  records: z.array(attendanceRecordSchema),
});

// ----- Homework -----
export const homeworkSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
});

// ----- Payments -----
export const paymentSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().positive().max(999999.99),
  payment_date: z.string(),
  payment_method: z.enum(['cash', 'transfer', 'check', 'other']),
  period_label: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// ----- Enrollment Fee -----
export const enrollmentFeeSchema = z.object({
  student_id: z.string().uuid(),
  class_id: z.string().uuid().optional(),
  amount: z.number().positive().max(999999.99),
  period_type: z.enum(['monthly', 'semester', 'annual', 'one_time']),
  label: z.string().max(200).optional().or(z.literal('')),
});
