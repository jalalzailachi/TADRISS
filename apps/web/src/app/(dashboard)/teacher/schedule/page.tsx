import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { TeacherScheduleClient } from './TeacherScheduleClient';

export const metadata: Metadata = {
  title: 'My Schedule | Tadriss',
};

export default async function TeacherSchedulePage() {
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
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const [periodsRes, schedulesRes, classesRes] = await Promise.all([
    admin
      .from('periods')
      .select('id, name, start_time, end_time, sort_order')
      .eq('institution_id', profile.institution_id)
      .order('sort_order'),
    admin
      .from('schedules')
      .select('id, class_id, period_id, day_of_week, subject_text, room')
      .eq('institution_id', profile.institution_id)
      .eq('teacher_id', user.id),
    admin
      .from('classes')
      .select('id, name')
      .eq('institution_id', profile.institution_id),
  ]);

  return (
    <TeacherScheduleClient
      periods={(periodsRes.data ?? []) as never[]}
      schedules={(schedulesRes.data ?? []) as never[]}
      classes={(classesRes.data ?? []) as never[]}
    />
  );
}
