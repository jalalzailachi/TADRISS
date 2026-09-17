import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AttendanceClient, type AttendanceSession, type Class } from './AttendanceClient'


export const metadata: Metadata = {
  title: 'Attendance | Tadriss',
  description: 'Manage student attendance',
}
export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['institution_admin', 'teacher'].includes(profile.role)) redirect('/login')

  // Fetch sessions and classes in parallel using admin client
  const [sessionsRes, classesRes] = await Promise.all([
    admin
      .from('attendance_sessions')
      .select(`
        id, session_date, notes,
        class:classes(id, name),
        teacher:profiles!attendance_sessions_teacher_id_fkey(first_name, last_name),
        records:attendance_records(status)
      `)
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null)
      .order('session_date', { ascending: false })
      .limit(50),
    admin
      .from('classes')
      .select('id, name')
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null),
  ])

  if (sessionsRes.error) console.error('[AttendancePage]', sessionsRes.error)

  const sessions = sessionsRes.data
  const classes = classesRes.data

  return (
    <div>
      <AttendanceClient
        sessions={(sessions || []) as unknown as AttendanceSession[]}
        classes={(classes || []) as unknown as Class[]}
      />
    </div>
  )
}
