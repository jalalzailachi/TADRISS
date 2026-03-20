import type { SupabaseClient } from '@supabase/supabase-js';

export async function getInstitution(client: SupabaseClient) {
  return await client.from('institutions').select('id, name, slug, email, phone, address, logo_url, settings, created_at').single();
}

export async function updateInstitution(
  client: SupabaseClient,
  data: { name?: string; address?: string; phone?: string; email?: string; logo_url?: string }
) {
  // institution_id derived from JWT — RLS enforces own institution only
  return await client.from('institutions').update(data).select().single();
}
