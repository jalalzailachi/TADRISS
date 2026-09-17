'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError(t('error'));
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={sent ? t('checkEmail') : t('resetPasswordTitle')}
      subtitle={sent ? t('resetSentDesc', { email }) : t('resetPasswordSubtitle')}
      locale={locale}
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-error-container/30 border border-error/20 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
              {t('email')}
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">alternate_email</span>
              <input
                id="reset-email"
                type="email"
                className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
                placeholder="admin@school.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 luxury-gradient text-white font-headline font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('sendResetLink')}</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">send</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-sm font-bold text-primary hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
             <div className="w-16 h-16 rounded-full bg-tertiary-fixed/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-tertiary">mark_email_read</span>
             </div>
          </div>
          <Link 
            href="/login" 
            className="w-full h-11 bg-surface-container-high text-on-surface font-headline font-bold text-sm rounded-xl flex items-center justify-center hover:bg-surface-container-highest transition-all"
          >
            {t('backToLogin')}
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
