import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentAttendanceClient, type AttendanceRecord } from './AttendanceClient'

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('status, marked_at, session:attendance_sessions(session_date, class:classes(name))')
    .eq('student_id', user.id)
    .order('marked_at', { ascending: false })

  return <StudentAttendanceClient attendance={(attendance || []) as unknown as AttendanceRecord[]} />
}
