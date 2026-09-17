'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdatePermissionSchema = z.object({
  role: z.enum(['institution_admin', 'teacher', 'student']),
  page_key: z.string().min(1),
  can_view: z.boolean(),
  can_edit: z.boolean(),
});

async function getAuthedAdmin() {
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
  if (!profile || profile.role !== 'institution_admin')
    return { error: 'Unauthorized' as const };
  return { profile, admin };
}

export async function updatePermission(input: unknown) {
  const parsed = UpdatePermissionSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedAdmin();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.admin
    .from('role_permissions')
    .upsert(
      {
        institution_id: auth.profile.institution_id,
        ...parsed.data,
      },
      { onConflict: 'institution_id,role,page_key' }
    );

  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings/permissions');
  return { success: true };
}

export async function bulkUpdatePermissions(
  entries: Array<{
    role: string;
    page_key: string;
    can_view: boolean;
    can_edit: boolean;
  }>
) {
  const auth = await getAuthedAdmin();
  if ('error' in auth) return { error: auth.error };

  const rows = entries.map((e) => ({
    institution_id: auth.profile.institution_id,
    ...e,
  }));

  const { error } = await auth.admin
    .from('role_permissions')
    .upsert(rows, { onConflict: 'institution_id,role,page_key' });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings/permissions');
  return { success: true };
}
