'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ActionResponse } from '@/types/actions'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['institution_admin', 'teacher'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }
  return { supabase, profile }
}

export async function createAttendanceSession(formData: FormData): Promise<ActionResponse> {
  try {
    const { supabase, profile } = await getUser()
    const classId = formData.get('class_id') as string
    const date = formData.get('session_date') as string
    const notes = formData.get('notes') as string

    // 1. Create session
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert({
        class_id:       classId,
        teacher_id:     profile.id,
        session_date:   date,
        notes:          notes || null,
        institution_id: profile.institution_id,
      })
      .select('id')
      .single()

    if (sessionError) return { success: false, error: sessionError.message }

    // 2. Auto-initialize records as 'present' for all students in class
    const { data: students } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)

    if (students && students.length > 0) {
      const records = students.map(s => ({
        session_id: session.id,
        student_id: s.student_id,
        status:     'present',
      }))
      await supabase.from('attendance_records').insert(records)
    }

    revalidatePath('/dashboard/attendance')
    return { success: true, sessionId: session.id }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
}

export async function updateAttendanceRecord(sessionId: string, studentId: string, status: 'present' | 'absent' | 'late' | 'excused'): Promise<ActionResponse> {
  try {
    const { supabase, profile } = await getUser()

    // Verify the session belongs to this institution before updating records
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('id, class_id, institution_id')
      .eq('id', sessionId)
      .eq('institution_id', profile.institution_id)
      .single()

    if (!session) return { success: false, error: 'Session not found' }

    const { error } = await supabase
      .from('attendance_records')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('student_id', studentId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
}

export async function deleteAttendanceSession(sessionId: string): Promise<ActionResponse> {
  try {
    const { supabase, profile } = await getUser()

    // Only admins can delete sessions; teachers can only create them
    if (profile.role !== 'institution_admin') {
      return { success: false, error: 'Only administrators can delete attendance sessions' }
    }

    const { error } = await supabase
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('institution_id', profile.institution_id)

    if (error) { console.error('[deleteAttendanceSession]', error); return { success: false, error: error.message } }
    revalidatePath('/dashboard/attendance')
    return { success: true }
  } catch (err) {
    const error = err as Error
    return { success: false, error: error.message }
  }
}
