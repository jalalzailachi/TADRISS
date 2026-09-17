'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ExamSchema = z.object({
  class_id: z.string().uuid(),
  subject_text: z.string().optional(),
  academic_term: z.string().optional(),
  name: z.string().min(1).max(200),
  exam_date: z.string(),
  duration_minutes: z.number().int().positive().optional(),
  max_score: z.number().positive().default(100),
  weight: z.number().positive().default(1),
});

const GradeEntrySchema = z.object({
  exam_id: z.string().uuid(),
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  score: z.number().min(0),
  comment: z.string().optional(),
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

export async function createExam(input: unknown) {
  const parsed = ExamSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (!['institution_admin', 'teacher'].includes(auth.profile.role))
    return { error: 'Unauthorized' };

  const { error, data } = await auth.admin
    .from('exams')
    .insert({
      ...parsed.data,
      institution_id: auth.profile.institution_id,
      created_by: auth.user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/dashboard/grades');
  return { success: true, id: data.id };
}

export async function upsertGrades(entries: unknown[]) {
  const parsed = z.array(GradeEntrySchema).safeParse(entries);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (!['institution_admin', 'teacher'].includes(auth.profile.role))
    return { error: 'Unauthorized' };

  const rows = parsed.data.map((e) => ({
    ...e,
    institution_id: auth.profile.institution_id,
    graded_by: auth.user.id,
  }));

  const { error } = await auth.admin
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,exam_id' });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/grades');
  revalidatePath('/student/grades');
  return { success: true, count: rows.length };
}

export async function deleteExam(id: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };
  if (auth.profile.role !== 'institution_admin') return { error: 'Unauthorized' };

  const { error } = await auth.admin
    .from('exams')
    .delete()
    .eq('id', id)
    .eq('institution_id', auth.profile.institution_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/grades');
  return { success: true };
}
