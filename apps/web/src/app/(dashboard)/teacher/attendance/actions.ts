'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAttendanceSession(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, institution_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') return { error: 'Unauthorized' }

    const classId = formData.get('class_id') as string
    const date = formData.get('date') as string

    if (!classId) return { error: 'Class is required' }
    if (!date) return { error: 'Date is required' }

    // Verify teacher is assigned to this class
    const { data: assignment } = await supabase
      .from('class_teachers')
      .select('id')
      .eq('class_id', classId)
      .eq('teacher_id', profile.id)
      .single()

    if (!assignment) return { error: 'You are not assigned to this class' }

    // Check for duplicate session today
    const { data: existing } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', classId)
      .eq('session_date', date)
      .single()

    if (existing) return { error: 'A session already exists for this class today' }

    // Create session
    const { data: session, error: sessionErr } = await supabase
      .from('attendance_sessions')
      .insert({ 
        class_id: classId, 
        session_date: date, 
        teacher_id: profile.id,
        institution_id: profile.institution_id 
      })
      .select('id')
      .single()

    if (sessionErr) {
      console.error('[createSession]', sessionErr)
      return { error: sessionErr.message }
    }

    revalidatePath('/teacher/attendance')
    return { success: true, sessionId: session.id }

  } catch (err) {
    console.error('[createSession] unexpected:', err)
    return { error: 'Failed to create session' }
  }
}

export async function submitAttendance(
  sessionId: string,
  records: { studentId: string; status: 'present' | 'absent' | 'late' }[]
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') return { error: 'Unauthorized' }

    // Verify teacher owns or is assigned to the class of this session
    const { data: session } = await supabase
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single()

    if (!session) return { error: 'Session not found' }

    const { data: assignment } = await supabase
      .from('class_teachers')
      .select('id')
      .eq('class_id', session.class_id)
      .eq('teacher_id', profile.id)
      .single()

    if (!assignment) return { error: 'Unauthorized' }

    // Delete existing records for this session (allow re-submission)
    await supabase.from('attendance_records').delete().eq('session_id', sessionId)

    // Insert all records
    const { error: insertErr } = await supabase
      .from('attendance_records')
      .insert(
        records.map(r => ({
          session_id: sessionId,
          student_id: r.studentId,
          status:     r.status,
        }))
      )

    if (insertErr) {
      console.error('[submitAttendance]', insertErr)
      return { error: insertErr.message }
    }

    revalidatePath('/teacher/attendance')
    revalidatePath('/student/attendance')
    revalidatePath('/dashboard/attendance')
    return { success: true }

  } catch (err) {
    console.error('[submitAttendance] unexpected:', err)
    return { error: 'Failed to save attendance' }
  }
}

export async function getStudentsForClass(classId: string) {
  try {
    const supabase = await createClient()
    const { data: students, error } = await supabase
      .from('class_students')
      .select(`
        student:profiles(id, first_name, last_name)
      `)
      .eq('class_id', classId)
      .eq('is_active', true)

    if (error) return { error: error.message }
    
    return { 
      students: (students as unknown as { student: { id: string; first_name: string; last_name: string } }[]).map((s) => ({
        id: s.student.id,
        name: `${s.student.first_name} ${s.student.last_name}`
      }))
    }
  } catch {
    return { error: 'Failed to fetch students' }
  }
}
