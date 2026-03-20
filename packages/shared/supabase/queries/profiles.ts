import type { SupabaseClient } from '@supabase/supabase-js';

export async function getProfiles(
  client: SupabaseClient,
  filters?: { role?: string; is_active?: boolean }
) {
  let query = client.from('profiles').select('id, institution_id, role, first_name, last_name, email, phone, is_active, last_login, created_at, must_change_password, requires_password_change');
  if (filters?.role) query = query.eq('role', filters.role);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  return await query.order('last_name');
}

export async function getTeachers(client: SupabaseClient) {
  return await getProfiles(client, { role: 'teacher', is_active: true });
}

export async function getStudents(client: SupabaseClient) {
  return await getProfiles(client, { role: 'student', is_active: true });
}

export async function getProfileById(client: SupabaseClient, profileId: string) {
  return await client.from('profiles').select('*').eq('id', profileId).single();
}

export async function updateProfile(
  client: SupabaseClient,
  profileId: string,
  data: { first_name?: string; last_name?: string; email?: string; phone?: string; is_active?: boolean }
) {
  return await client.from('profiles').update(data).eq('id', profileId).select().single();
}

export async function deactivateProfile(client: SupabaseClient, profileId: string) {
  return await updateProfile(client, profileId, { is_active: false });
}
