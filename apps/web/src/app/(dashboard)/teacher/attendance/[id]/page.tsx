import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SessionDetailClient, type Session, type StudentRecord, type ClassStudent } from '@/app/(dashboard)/dashboard/attendance/[id]/SessionDetailClient'

export const metadata: Metadata = {
  title: 'Session Details | Tadriss',
  description: 'View and manage attendance session',
}

export default async function TeacherAttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  const [sessionRes, recordsRes] = await Promise.all([
    admin
      .from('attendance_sessions')
      .select(`
        id, session_date, notes, class_id, teacher_id,
        class:classes(id, name),
        teacher:profiles!attendance_sessions_teacher_id_fkey(first_name, last_name)
      `)
      .eq('id', id)
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null)
      .single(),
    admin
      .from('attendance_records')
      .select(`
        id, student_id, status,
        student:profiles!attendance_records_student_id_fkey(id, first_name, last_name)
      `)
      .eq('session_id', id),
  ])

  if (sessionRes.error || !sessionRes.data) notFound()

  // Verify teacher owns this session
  if (sessionRes.data.teacher_id !== profile.id) notFound()

  const { data: classStudents } = await admin
    .from('class_students')
    .select(`
      student_id,
      student:profiles!class_students_student_id_fkey(id, first_name, last_name)
    `)
    .eq('class_id', sessionRes.data.class_id)

  return (
    <SessionDetailClient
      session={sessionRes.data as unknown as Session}
      records={(recordsRes.data || []) as unknown as StudentRecord[]}
      classStudents={(classStudents || []) as unknown as ClassStudent[]}
      isAdmin={false}
    />
  )
}
