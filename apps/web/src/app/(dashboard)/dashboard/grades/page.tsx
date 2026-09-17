import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { GradesClient } from './GradesClient';

export const metadata: Metadata = {
  title: 'Grades | Tadriss',
};

export default async function GradesPage() {
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

  const [classesRes, examsRes, studentsRes, gradesRes] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, grade_level')
      .eq('institution_id', profile.institution_id)
      .order('name'),
    admin
      .from('exams')
      .select(
        'id, class_id, subject_text, academic_term, name, exam_date, max_score, weight'
      )
      .eq('institution_id', profile.institution_id)
      .order('exam_date', { ascending: false }),
    admin
      .from('class_students')
      .select('class_id, student:profiles!class_students_student_id_fkey(id, first_name, last_name)')
      .eq('institution_id', profile.institution_id),
    admin
      .from('grades')
      .select('id, exam_id, student_id, score, comment')
      .eq('institution_id', profile.institution_id),
  ]);

  return (
    <GradesClient
      classes={(classesRes.data ?? []) as never[]}
      exams={(examsRes.data ?? []) as never[]}
      enrollments={(studentsRes.data ?? []) as never[]}
      grades={(gradesRes.data ?? []) as never[]}
    />
  );
}
