import type { SupabaseClient } from '@supabase/supabase-js';

export async function getClasses(client: SupabaseClient, activeOnly = true) {
  let query = client.from('classes').select('id, institution_id, name, description, subject, level, schedule_days, schedule_time, is_active, created_at');
  if (activeOnly) query = query.eq('is_active', true);
  return await query.order('name');
}

export async function getClassById(client: SupabaseClient, classId: string) {
  return await client.from('classes').select('id, institution_id, name, description, subject, level, schedule_days, schedule_time, is_active, created_at').eq('id', classId).single();
}

export async function createClass(
  client: SupabaseClient,
  data: {
    institution_id: string;
    name: string;
    subject?: string;
    level?: string;
    schedule_days?: string[];
    schedule_time?: string;
  }
) {
  return await client.from('classes').insert(data).select().single();
}

export async function updateClass(
  client: SupabaseClient,
  classId: string,
  data: { name?: string; subject?: string; level?: string; schedule_days?: string[]; schedule_time?: string; is_active?: boolean }
) {
  return await client.from('classes').update(data).eq('id', classId).select().single();
}

// ----- Class-Teacher assignments -----

export async function getClassTeachers(client: SupabaseClient, classId: string) {
  return await client
    .from('class_teachers')
    .select('id, institution_id, class_id, teacher_id, created_at, profiles:teacher_id(id, first_name, last_name, email)')
    .eq('class_id', classId);
}

export async function assignTeacher(
  client: SupabaseClient,
  data: { institution_id: string; class_id: string; teacher_id: string }
) {
  return await client.from('class_teachers').insert(data).select().single();
}

export async function removeTeacher(client: SupabaseClient, classId: string, teacherId: string) {
  return await client
    .from('class_teachers')
    .delete()
    .eq('class_id', classId)
    .eq('teacher_id', teacherId);
}

// ----- Class-Student enrollments -----

export async function getClassStudents(client: SupabaseClient, classId: string) {
  return await client
    .from('class_students')
    .select('id, institution_id, class_id, student_id, is_active, created_at, profiles:student_id(id, first_name, last_name, email)')
    .eq('class_id', classId)
    .eq('is_active', true);
}

export async function enrollStudent(
  client: SupabaseClient,
  data: { institution_id: string; class_id: string; student_id: string }
) {
  return await client.from('class_students').insert(data).select().single();
}

export async function unenrollStudent(client: SupabaseClient, classId: string, studentId: string) {
  return await client
    .from('class_students')
    .update({ is_active: false })
    .eq('class_id', classId)
    .eq('student_id', studentId);
}
