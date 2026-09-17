'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { randomBytes } from 'crypto'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars[bytes[i]! % chars.length]
  }
  return password + '!1'
}

const teacherSchema = z.object({
  email:      z.string().email('Adresse e-mail invalide'),
  first_name: z.string().min(1, 'Prénom requis').max(100),
  last_name:  z.string().min(1, 'Nom requis').max(100),
  phone:      z.string().max(20).optional().or(z.literal('')),
})

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

export async function addTeacher(formData: FormData) {
  try {
    const raw = {
      email:      formData.get('email'),
      first_name: formData.get('first_name'),
      last_name:  formData.get('last_name'),
      phone:      formData.get('phone'),
    }
    const parsed = teacherSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()
    const tempPassword = generatePassword()

    // 1. Create Auth User — email_confirm: true skips verification email
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email:         parsed.data.email,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: parsed.data.first_name,
        last_name:  parsed.data.last_name,
      },
      app_metadata: {
        institution_id: adminProfile.institution_id,
        role:           'teacher',
      }
    })

    if (authError) {
      console.error('[addTeacher] createUser error:', authError)
      if (authError.message.includes('already registered')) return { error: 'Cet e-mail est déjà enregistré.' }
      return { error: authError.message }
    }

    // 2. Create Profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id:                       authData.user.id,
      institution_id:           adminProfile.institution_id,
      role:                     'teacher',
      first_name:               parsed.data.first_name,
      last_name:                parsed.data.last_name,
      email:                    parsed.data.email,
      phone:                    parsed.data.phone || null,
      requires_password_change: true,
    })

    if (profileError) {
      console.error('[addTeacher] profile insert error:', profileError)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: profileError.message }
    }

    revalidatePath('/dashboard/teachers')
    return { success: true, password: tempPassword }
  } catch (err) {
    console.error('[addTeacher] unexpected:', err)
    return { error: getErrorMessage(err, 'Une erreur inattendue est survenue') }
  }
}

export async function updateTeacher(teacherId: string, formData: FormData) {
  try {
    const raw = {
      email:      formData.get('email'),
      first_name: formData.get('first_name'),
      last_name:  formData.get('last_name'),
      phone:      formData.get('phone'),
    }
    const parsed = teacherSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    // Update profile — use .select() to verify the update affected a row
    const { data: updated, error: profileError } = await adminClient.from('profiles').update({
      first_name: parsed.data.first_name,
      last_name:  parsed.data.last_name,
      email:      parsed.data.email,
      phone:      parsed.data.phone || null,
    })
    .eq('id', teacherId)
    .eq('institution_id', adminProfile.institution_id)
    .select('id')

    if (profileError) return { error: profileError.message }
    if (!updated || updated.length === 0) return { error: 'Enseignant non trouvé dans votre établissement.' }

    // Update auth email/metadata — only after verifying profile belongs to this institution
    const { error: authError } = await adminClient.auth.admin.updateUserById(teacherId, {
      email: parsed.data.email,
      user_metadata: {
        first_name: parsed.data.first_name,
        last_name:  parsed.data.last_name,
      }
    })
    if (authError) console.error('[updateTeacher] auth update error:', authError)

    revalidatePath('/dashboard/teachers')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function deleteTeacher(teacherId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile } = adminResult
    const adminClient = await createAdminClient()

    // Verify teacher belongs to this institution before acting
    const { data: profile } = await adminClient.from('profiles')
      .select('id')
      .eq('id', teacherId)
      .eq('institution_id', adminProfile.institution_id)
      .single()

    if (!profile) return { error: 'Teacher not found' }

    // Soft-delete: set deleted_at and disable the auth account (100-year ban)
    const { error: profileError } = await adminClient.from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', teacherId)
      .eq('institution_id', adminProfile.institution_id)

    if (profileError) return { error: profileError.message }

    await adminClient.auth.admin.updateUserById(teacherId, {
      ban_duration: '876000h', // ~100 years — effectively disabled
    })

    revalidatePath('/dashboard/teachers')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}
