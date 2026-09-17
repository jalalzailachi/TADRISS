'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/errors'

export async function completePasswordChange(newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 8) {
      return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non autorisé — veuillez vous reconnecter.' }

    // 1. Update the auth password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      console.error('[completePasswordChange] updateUser error:', updateError)
      return { error: updateError.message }
    }

    // 2. Clear password change flags using admin client (bypasses RLS)
    const adminClient = await createAdminClient()
    const { error: profileError } = await adminClient.from('profiles')
      .update({
        requires_password_change: false,
        must_change_password: false,
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('[completePasswordChange] profile update error:', profileError)
      return { error: profileError.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[completePasswordChange] unexpected:', err)
    return { error: getErrorMessage(err, 'Une erreur inattendue est survenue') }
  }
}
