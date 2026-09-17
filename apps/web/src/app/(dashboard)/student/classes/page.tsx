import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentClassesClient, type StudentClass } from './ClassesClient'

export default async function StudentClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('class:classes(id, name, subject, level)')
    .eq('student_id', user.id)
    .eq('is_active', true)

  const classes = ((studentClasses ?? []) as unknown as { class: StudentClass }[]).map((c) => c.class)

  return <StudentClassesClient classes={classes} />
}
