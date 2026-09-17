'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionResponse } from '@/types/actions'

export async function updatePaymentStatus(paymentId: string, status: 'paid' | 'voided'): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    // Admin verification — institution_id from DB, never from request
    const { data: profile } = await supabase.from('profiles').select('role, institution_id').eq('id', user.id).single()
    if (profile?.role !== 'institution_admin') return { success: false, error: 'Accès refusé' }

    // Get current payment — named columns only, no select('*')
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('id, student_id, institution_id, status, amount, description')
      .eq('id', paymentId)
      .eq('institution_id', profile.institution_id)
      .single()

    if (pError || !payment) return { success: false, error: 'Paiement introuvable' }

    // Prevent double voiding
    if (status === 'voided' && payment.status === 'voided') {
      return { success: false, error: 'Ce paiement est déjà annulé' }
    }

    // Update payment status
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId)
      .eq('institution_id', profile.institution_id)

    if (error) { console.error('[updatePaymentStatus]', error); return { success: false, error: error.message } }

    // Sync with enrollment fees
    if (status === 'paid') {
      const { data: pendingFees } = await supabase
        .from('enrollment_fees')
        .select('id')
        .eq('student_id', payment.student_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)

      if (pendingFees && pendingFees.length > 0) {
        await supabase
          .from('enrollment_fees')
          .update({ status: 'paid' })
          .eq('id', pendingFees[0].id)
      }

      revalidatePath('/student')
      revalidatePath('/dashboard/payments')
    }

    if (status === 'voided') {
      revalidatePath('/dashboard/payments')
    }

    return { success: true }
  } catch (err) {
    console.error('[updatePaymentStatus] unexpected:', err)
    return { success: false, error: 'Une erreur inattendue est survenue' }
  }
}
