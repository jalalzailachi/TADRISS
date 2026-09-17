'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const classSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  subject:  z.string().max(100).optional(),
  schedule: z.string().max(200).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
})

// ── Helper: get verified admin profile ──────────────────────────────
async function getAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé — veuillez vous reconnecter.' }

  const adminClient = await createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }
  if (profile.role !== 'institution_admin') return { error: 'Accès réservé aux administrateurs.' }
  return { adminProfile: profile }
}

// ── CREATE ───────────────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  try {
    const raw = {
      name:     formData.get('name'),
      subject:  formData.get('subject'),
      schedule: formData.get('schedule'),
      capacity: formData.get('capacity'),
    }
    const parsed = classSchema.safeParse(raw)
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message }
    }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    // Create record
    const { data: cls, error: clsError } = await adminClient.from('classes').insert({
      name:           parsed.data.name,
      subject:        parsed.data.subject || null,
      schedule:       parsed.data.schedule || null,
      capacity:       parsed.data.capacity ?? 30,
      institution_id: adminProfile.institution_id,
    }).select('id').single()

    if (clsError) {
      console.error('[createClass]', clsError)
      if (clsError.code === '42501') return { error: 'Permission denied. Check RLS policies.' }
      return { error: clsError.message }
    }

    revalidatePath('/dashboard/classes')
    return { success: true, classId: cls.id }

  } catch (err) {
    console.error('[createClass] unexpected:', err)
    return { error: getErrorMessage(err, 'Failed to create class') }
  }
}

// ── UPDATE ───────────────────────────────────────────────────────────
export async function updateClass(classId: string, formData: FormData) {
  try {
    const parsed = classSchema.safeParse({
      name:     formData.get('name'),
      subject:  formData.get('subject'),
      schedule: formData.get('schedule'),
      capacity: formData.get('capacity'),
    })
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error: clsError } = await adminClient.from('classes').update({
      name:     parsed.data.name,
      subject:  parsed.data.subject || null,
      schedule: parsed.data.schedule || null,
      capacity: parsed.data.capacity ?? 30,
    })
    .eq('id', classId)
    .eq('institution_id', adminProfile.institution_id)

    if (clsError) {
      console.error('[updateClass]', clsError)
      return { error: clsError.message }
    }

    revalidatePath('/dashboard/classes')
    revalidatePath(`/dashboard/classes/${classId}`)
    return { success: true }

  } catch (err) {
    return { error: getErrorMessage(err, 'Failed to update class') }
  }
}

// ── DELETE ───────────────────────────────────────────────────────────
export async function deleteClass(classId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error } = await adminClient.rpc('delete_class_cascade', {
      p_class_id:       classId,
      p_institution_id: adminProfile.institution_id,
    })

    if (error) {
      console.error('[deleteClass]', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    return { success: true }

  } catch (err) {
    return { error: getErrorMessage(err, 'Failed to delete class') }
  }
}

// ── ENROLL TEACHER ───────────────────────────────────────────────────
export async function enrollTeacher(classId: string, teacherId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('class_teachers').upsert({
      class_id:   classId,
      teacher_id: teacherId,
      institution_id: adminProfile.institution_id,
    }, { onConflict: 'class_id,teacher_id' })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/classes/${classId}`)
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

// ── ENROLL STUDENT ───────────────────────────────────────────────────
export async function enrollStudent(classId: string, studentId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('class_students').upsert({ // Changed from supabase
      class_id:   classId,
      student_id: studentId,
      institution_id: adminProfile.institution_id, // Added institution_id
    }, { onConflict: 'class_id,student_id' })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/classes/${classId}`)
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

// ── REMOVE STUDENT ───────────────────────────────────────────────────
export async function removeStudent(classId: string, studentId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('class_students') // Changed from supabase
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('institution_id', adminProfile.institution_id)

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/classes/${classId}`)
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

// ── REMOVE TEACHER ───────────────────────────────────────────────────
export async function removeTeacher(classId: string, teacherId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('class_teachers')
      .delete()
      .eq('class_id', classId)
      .eq('teacher_id', teacherId)
      .eq('institution_id', adminProfile.institution_id)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/classes/${classId}`)
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

// ── SEARCH CLASSES ───────────────────────────────────────────────────
export async function searchClasses(searchTerm: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    let query = adminClient
      .from('classes')
      .select('id, name, subject, schedule, capacity')
      .eq('institution_id', adminProfile.institution_id)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data: classes, error } = await query

    if (error) {
      console.error('[searchClasses]', error)
      return { error: error.message }
    }

    return { classes }
  } catch (err) {
    console.error('[searchClasses] unexpected:', err)
    return { error: getErrorMessage(err, 'Failed to search classes') }
  }
}
