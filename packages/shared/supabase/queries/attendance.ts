import type { SupabaseClient } from '@supabase/supabase-js';

export async function createAttendanceSession(
  client: SupabaseClient,
  data: {
    institution_id: string;
    class_id: string;
    teacher_id: string;
    session_date: string;
  }
) {
  return await client.from('attendance_sessions').insert(data).select().single();
}

export async function completeSession(client: SupabaseClient, sessionId: string) {
  return await client
    .from('attendance_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
}

export async function markAttendance(
  client: SupabaseClient,
  records: { session_id: string; student_id: string; status: string }[]
) {
  return await client.from('attendance_records').upsert(records, {
    onConflict: 'session_id,student_id',
  });
}

export async function getSessionsByClass(
  client: SupabaseClient,
  classId: string,
  options?: { from?: string; to?: string }
) {
  let query = client
    .from('attendance_sessions')
    .select('id, institution_id, class_id, teacher_id, session_date, created_at, completed_at, attendance_records(id, student_id, status)')
    .eq('class_id', classId)
    .order('session_date', { ascending: false });

  if (options?.from) query = query.gte('session_date', options.from);
  if (options?.to) query = query.lte('session_date', options.to);
  return await query;
}

export async function getStudentAttendance(client: SupabaseClient, studentId: string) {
  return await client
    .from('attendance_records')
    .select('id, session_id, student_id, status, marked_at, attendance_sessions!inner(class_id, session_date)')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });
}
