import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { TeacherAttendanceClient, type SessionSummary, type AssignedClass } from './TeacherAttendanceClient'
import { redirect } from 'next/navigation'

export default async function TeacherAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch historical sessions for this teacher
  const { data: sessions, error: sessionsError } = await supabase
    .from('attendance_sessions')
    .select('id, session_date, started_at, class:classes(name), records:attendance_records(count)')
    .eq('teacher_id', user.id)
    .order('session_date', { ascending: false })

  if (sessionsError) console.error('[TeacherAttendancePage] sessionsError:', sessionsError)

  // 2. Fetch classes assigned to this teacher
  const { data: assignedClassesData, error: classesError } = await supabase
    .from('class_teachers')
    .select('class:classes(id, name)')
    .eq('teacher_id', user.id)

  if (classesError) console.error('[TeacherAttendancePage] classesError:', classesError)

  const assignedClasses = ((assignedClassesData ?? []) as unknown as { class: AssignedClass }[]).map((c) => c.class)

  return (
    <TeacherAttendanceClient
      sessions={(sessions || []) as unknown as SessionSummary[]}
      assignedClasses={assignedClasses}
    />
  )
}
