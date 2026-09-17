'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const DocumentSchema = z.object({
  name: z.string().min(1).max(200),
  file_url: z.string().url(),
  file_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  student_id: z.string().uuid().optional().nullable(),
});

async function getAuthedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const };
  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Profile not found' as const };
  return { user, profile, admin };
}

export async function createDocument(input: unknown) {
  const parsed = DocumentSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.admin.from('documents').insert({
    ...parsed.data,
    institution_id: auth.profile.institution_id,
    uploaded_by: auth.user.id,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/documents');
  return { success: true };
}

export async function deleteDocument(id: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/documents');
  return { success: true };
}
