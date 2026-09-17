import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { StudentGradesClient } from './StudentGradesClient';

export const metadata: Metadata = {
  title: 'My Grades | Tadriss',
};

export default async function StudentGradesPage() {
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
  if (!profile || profile.role !== 'student') redirect('/login');

  const [gradesRes, examsRes] = await Promise.all([
    admin
      .from('grades')
      .select('id, exam_id, score, comment')
      .eq('student_id', user.id),
    admin
      .from('exams')
      .select('id, class_id, subject_text, name, exam_date, max_score, weight')
      .eq('institution_id', profile.institution_id)
      .order('exam_date', { ascending: false }),
  ]);

  return (
    <StudentGradesClient
      grades={(gradesRes.data ?? []) as never[]}
      exams={(examsRes.data ?? []) as never[]}
    />
  );
}
