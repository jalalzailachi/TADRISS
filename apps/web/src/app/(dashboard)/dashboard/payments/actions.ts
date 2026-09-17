'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const paymentSchema = z.object({
  student_id:     z.string().uuid('Élève invalide'),
  amount:         z.coerce.number().positive('Le montant doit être positif'),
  payment_method: z.string().min(1, 'Le mode de paiement est requis'),
  payment_date:   z.string(),
  period_label:   z.string().optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
  fee_id:         z.string().optional().or(z.literal('')),
})

const feeSchema = z.object({
  student_id:  z.string().uuid('Élève invalide'),
  amount:      z.coerce.number().positive('Le montant doit être positif'),
  label:       z.string().min(1, 'Le libellé est requis'),
  class_id:    z.string().optional().or(z.literal('')),
  period_type: z.enum(['monthly', 'semester', 'annual', 'one_time']).default('monthly'),
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
  return { adminProfile: profile, adminClient }
}

export async function recordPayment(formData: FormData) {
  try {
    const raw = {
      student_id:     formData.get('student_id'),
      amount:         formData.get('amount'),
      payment_method: formData.get('payment_method'),
      payment_date:   formData.get('payment_date'),
      period_label:   formData.get('period_label'),
      notes:          formData.get('notes'),
      fee_id:         formData.get('fee_id') || undefined,
    }
    const parsed = paymentSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile, adminClient } = adminResult

    const { error } = await adminClient.from('payments').insert({
      institution_id: adminProfile.institution_id,
      student_id:     parsed.data.student_id,
      amount:         parsed.data.amount,
      payment_method: parsed.data.payment_method,
      payment_date:   parsed.data.payment_date,
      period_label:   parsed.data.period_label || null,
      notes:          parsed.data.notes || null,
      status:         'recorded',
      recorded_by:    adminProfile.id,
    })

    if (error) return { error: error.message }

    // If linked to a fee, mark fee as inactive once fully covered
    const feeId = parsed.data.fee_id
    if (feeId) {
      const { data: fee } = await adminClient
        .from('enrollment_fees')
        .select('id, amount, student_id')
        .eq('id', feeId)
        .eq('institution_id', adminProfile.institution_id)
        .single()

      if (fee) {
        const { data: payments } = await adminClient
          .from('payments')
          .select('amount')
          .eq('student_id', fee.student_id)
          .eq('institution_id', adminProfile.institution_id)
          .eq('status', 'recorded')

        const totalPaid = (payments || []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)
        if (totalPaid >= Number(fee.amount)) {
          await adminClient.from('enrollment_fees').update({ is_active: false }).eq('id', feeId)
        }
      }
    }

    revalidatePath('/dashboard/payments')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function voidPayment(paymentId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile, adminClient } = adminResult

    const { data: payment, error: fetchErr } = await adminClient
      .from('payments')
      .select('id, status')
      .eq('id', paymentId)
      .eq('institution_id', adminProfile.institution_id)
      .single()

    if (fetchErr || !payment) return { error: 'Paiement introuvable.' }
    if (payment.status === 'voided') return { error: 'Ce paiement est déjà annulé.' }

    const { error } = await adminClient.from('payments')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: adminProfile.id,
      })
      .eq('id', paymentId)
      .eq('institution_id', adminProfile.institution_id)

    if (error) { console.error('[voidPayment]', error); return { error: error.message } }
    revalidatePath('/dashboard/payments')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function addFee(formData: FormData) {
  try {
    const raw = {
      student_id:  formData.get('student_id'),
      amount:      formData.get('amount'),
      label:       formData.get('label'),
      class_id:    formData.get('class_id'),
      period_type: formData.get('period_type') || 'monthly',
    }
    const parsed = feeSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile, adminClient } = adminResult

    const { error } = await adminClient.from('enrollment_fees').insert({
      student_id:     parsed.data.student_id,
      institution_id: adminProfile.institution_id,
      amount:         parsed.data.amount,
      label:          parsed.data.label,
      class_id:       parsed.data.class_id || null,
      period_type:    parsed.data.period_type,
    })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/payments')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function addBulkClassFee(formData: FormData) {
  try {
    const classId    = formData.get('class_id') as string
    const amount     = Number(formData.get('amount'))
    const label      = formData.get('label') as string
    const periodType = (formData.get('period_type') as string) || 'monthly'

    if (!classId) return { error: 'La classe est requise.' }
    if (!amount || amount <= 0) return { error: 'Le montant doit être positif.' }
    if (!label) return { error: 'Le libellé est requis.' }

    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile, adminClient } = adminResult

    const { data: classStudents, error: csError } = await adminClient
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)

    if (csError) return { error: csError.message }
    if (!classStudents || classStudents.length === 0) return { error: 'Aucun élève inscrit dans cette classe.' }

    const fees = classStudents.map((cs: { student_id: string }) => ({
      student_id:     cs.student_id,
      institution_id: adminProfile.institution_id,
      amount,
      label,
      class_id:       classId,
      period_type:    periodType,
    }))

    const { error } = await adminClient.from('enrollment_fees').insert(fees)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/payments')
    return { success: true, count: classStudents.length }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function deleteFee(feeId: string) {
  try {
    const adminResult = await getAdmin()
    if ('error' in adminResult) return { error: adminResult.error }
    const { adminProfile, adminClient } = adminResult

    const { error } = await adminClient
      .from('enrollment_fees')
      .delete()
      .eq('id', feeId)
      .eq('institution_id', adminProfile.institution_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/payments')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}
