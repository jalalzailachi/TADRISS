'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  audience: z.enum(['all', 'teachers', 'students', 'parents']).default('all'),
  is_pinned: z.boolean().default(false),
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

export async function createAnnouncement(input: unknown) {
  const parsed = AnnouncementSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin.from('broadcasts').insert({
    institution_id: auth.profile.institution_id,
    sender_id: auth.user.id,
    title: parsed.data.title,
    message: parsed.data.message,
    audience: parsed.data.audience,
    role_target: parsed.data.audience,
    is_pinned: parsed.data.is_pinned,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/announcements');
  return { success: true };
}

export async function togglePinAnnouncement(id: string, pinned: boolean) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('broadcasts')
    .update({ is_pinned: pinned })
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/announcements');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('broadcasts')
    .delete()
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/announcements');
  return { success: true };
}
