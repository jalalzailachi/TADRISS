'use client'
import { useState } from 'react'
import { useToast } from './ui/Toast'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { completePasswordChange } from '@/app/actions/password'

export function ForcePasswordChangeCard() {
  const t = useTranslations('passwordChange')
  const common = useTranslations('common')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const toast = useToast()
  const router = useRouter()

  async function handleSubmit() {
    if (newPassword.length < 8) return setError(t('minLength'))
    if (newPassword !== confirm) return setError(t('mismatch'))
    setLoading(true)
    setError('')

    const result = await completePasswordChange(newPassword)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    toast.success(t('success'))

    // Refresh to unlock layout
    setTimeout(() => {
      router.refresh()
    }, 1500)
  }

  // ── Success state ──
  if (done) return (
    <div className="rounded-2xl p-6 flex items-center gap-4 anim-in bg-tertiary-fixed/10 border border-tertiary/20">
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-tertiary/15">
        <span className="material-symbols-outlined text-tertiary fill-1">
          verified
        </span>
      </div>
      <div>
        <p className="font-extrabold text-base text-tertiary">
          {t('passwordUpdated')}
        </p>
        <p className="text-sm text-tertiary">{t('success')}</p>
      </div>
    </div>
  )

  // ── Main card — matches front.ts "Security: Force Password Change" ──
  return (
    <div className="rounded-2xl overflow-hidden anim-in bg-secondary-fixed/10 border border-secondary-container/25 shadow-lg shadow-secondary-container/5 relative isolate">
      {/* Decorative amber blob */}
      <div className="absolute -top-24 -end-24 w-64 h-64 rounded-full -z-10 bg-secondary-fixed/10 blur-3xl" />

      <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
        {/* Lock icon */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-secondary-container/12">
            <span className="material-symbols-outlined text-3xl text-secondary fill-1">
              lock
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 font-headline text-on-surface">
              {t('title') || 'Set Your Password'}
            </h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              {t('description') || 'For your security, please set a personal password before continuing.'}
            </p>
          </div>

          {/* Two-column inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-widest px-1 text-outline">
                {t('newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 transition-all outline-none bg-surface-container-lowest border border-secondary-container/25 text-on-surface text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-widest px-1 text-outline">
                {t('confirmPassword') || 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full h-11 rounded-xl px-4 transition-all outline-none bg-surface-container-lowest border border-secondary-container/25 text-on-surface text-sm"
                />
              </div>
            </div>
          </div>

          {/* Error + CTA */}
          <div className="flex items-center justify-between pt-2 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-outline-variant">info</span>
              <span className="text-xs tracking-tight font-mono text-outline-variant">
                {t('minLength') || 'Min. 8 characters required'}
              </span>
            </div>

            <div className="flex flex-col items-end gap-2">
              {error && (
                <p className="text-xs font-bold text-error">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !newPassword || !confirm}
                className="flex items-center gap-3 px-8 h-11 rounded-xl font-extrabold text-sm text-white transition-all disabled:opacity-40 bg-secondary shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] font-headline"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                )}
                {loading ? common('loading') : (t('submit') || 'Set Password & Continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
