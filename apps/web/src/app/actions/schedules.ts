'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ScheduleSchema = z.object({
  class_id: z.string().uuid(),
  period_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  subject_text: z.string().optional(),
  teacher_id: z.string().uuid().optional().nullable(),
  room: z.string().optional(),
});

const PeriodSchema = z.object({
  name: z.string().min(1).max(100),
  start_time: z.string(),
  end_time: z.string(),
  sort_order: z.number().int().nonnegative(),
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

export async function upsertSchedule(input: unknown) {
  const parsed = ScheduleSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin.from('schedules').upsert(
    {
      ...parsed.data,
      institution_id: auth.profile.institution_id,
    },
    { onConflict: 'class_id,period_id,day_of_week' }
  );

  if (error) return { error: error.message };
  revalidatePath('/dashboard/schedule');
  revalidatePath('/teacher/schedule');
  return { success: true };
}

export async function deleteSchedule(id: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/schedule');
  return { success: true };
}

export async function upsertPeriod(id: string | null, input: unknown) {
  const parsed = PeriodSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  if (id) {
    const { error } = await auth.admin
      .from('periods')
      .update(parsed.data)
      .eq('id', id)
      .eq('institution_id', auth.profile.institution_id);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.admin.from('periods').insert({
      ...parsed.data,
      institution_id: auth.profile.institution_id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath('/dashboard/schedule');
  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function deletePeriod(id: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('periods')
    .delete()
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/schedule');
  return { success: true };
}
