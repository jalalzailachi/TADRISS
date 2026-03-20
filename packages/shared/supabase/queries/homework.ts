import type { SupabaseClient } from '@supabase/supabase-js';

export async function getHomework(
  client: SupabaseClient,
  classId: string,
  options?: { upcoming?: boolean }
) {
  let query = client
    .from('homework')
    .select('id, institution_id, class_id, teacher_id, title, description, due_date, file_url, created_at, profiles:teacher_id(first_name, last_name)')
    .eq('class_id', classId)
    .order('due_date', { ascending: true });

  if (options?.upcoming) {
    query = query.gte('due_date', new Date().toISOString().split('T')[0]);
  }
  return await query;
}

export async function createHomework(
  client: SupabaseClient,
  data: {
    institution_id: string;
    class_id: string;
    teacher_id: string;
    title: string;
    description?: string;
    due_date?: string;
    file_url?: string;
  }
) {
  return await client.from('homework').insert(data).select().single();
}

export async function updateHomework(
  client: SupabaseClient,
  homeworkId: string,
  data: { title?: string; description?: string; due_date?: string; file_url?: string }
) {
  return await client.from('homework').update(data).eq('id', homeworkId).select().single();
}

export async function deleteHomework(client: SupabaseClient, homeworkId: string) {
  return await client.from('homework').delete().eq('id', homeworkId);
}
