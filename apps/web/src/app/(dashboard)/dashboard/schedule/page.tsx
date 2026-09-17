import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ScheduleClient } from './ScheduleClient';

export const metadata: Metadata = {
  title: 'Schedule | Tadriss',
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'institution_admin') redirect('/login');

  const [classesRes, periodsRes, schedulesRes, teachersRes] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, grade_level')
      .eq('institution_id', profile.institution_id)
      .order('name'),
    admin
      .from('periods')
      .select('id, name, start_time, end_time, sort_order')
      .eq('institution_id', profile.institution_id)
      .order('sort_order'),
    admin
      .from('schedules')
      .select('id, class_id, period_id, day_of_week, subject_text, teacher_id, room')
      .eq('institution_id', profile.institution_id),
    admin
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('institution_id', profile.institution_id)
      .eq('role', 'teacher')
      .eq('is_active', true)
      .order('first_name'),
  ]);

  return (
    <ScheduleClient
      classes={(classesRes.data ?? []) as never[]}
      periods={(periodsRes.data ?? []) as never[]}
      schedules={(schedulesRes.data ?? []) as never[]}
      teachers={(teachersRes.data ?? []) as never[]}
    />
  );
}
