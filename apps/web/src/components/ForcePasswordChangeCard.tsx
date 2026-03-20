'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './ui/Toast'

export function ForcePasswordChangeCard() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  async function handleSubmit() {
    if (newPassword.length < 8) return setError('Minimum 8 characters')
    if (newPassword !== confirm) return setError('Passwords do not match')
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) { 
      setError(updateError.message)
      setLoading(false)
      return 
    }

    // Clear the flag in profiles
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: profileError } = await supabase.from('profiles')
        .update({ 
          requires_password_change: false,
          must_change_password: false // Also clear the old flag for consistency
        })
        .eq('id', user.id)
      
      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    setDone(true)
    setLoading(false)
    toast.success('Mot de passe mis à jour avec succès.')
  }

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 flex items-center gap-3">
      <span className="material-symbols-outlined text-green-600">check_circle</span>
      <p className="font-medium">✅ Password updated successfully. You're all set.</p>
    </div>
  )

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6 mb-6 shadow-md">
      <h2 className="text-lg font-bold text-amber-800 mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined">lock_reset</span>
        🔐 Set Your Password
      </h2>
      <p className="text-sm text-amber-700 mb-4">
        For your security, please set a personal password before continuing.
      </p>
      <div className="space-y-3">
        <input
          type="password"
          placeholder="New password (min. 8 characters)"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Saving...' : 'Set Password & Continue'}
        </button>
      </div>
    </div>
  )
}
