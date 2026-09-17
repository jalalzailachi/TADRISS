'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const };
  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'super_admin')
    return { error: 'Unauthorized' as const };
  return { user, admin };
}

const CreateInstitutionSchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().optional(),
  phone: z.string().optional(),
  max_students: z.number().int().positive().optional(),
  max_teachers: z.number().int().positive().optional(),
});

export async function createInstitution(input: unknown) {
  const parsed = CreateInstitutionSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await requireSuperAdmin();
  if ('error' in auth) return { error: auth.error };

  const { error, data } = await auth.admin
    .from('institutions')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/super/institutions');
  return { success: true, id: data.id };
}

export async function toggleInstitutionActive(id: string, isActive: boolean) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.admin
    .from('institutions')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/super/institutions');
  revalidatePath(`/super/institutions/${id}`);
  return { success: true };
}
