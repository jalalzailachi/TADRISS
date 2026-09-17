'use client'

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function LoginForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('data')) {
          setError(t('invalidCredentials') || 'Invalid email or password');
        } else if (msg.includes('email not confirmed')) {
          setError(t('emailNotConfirmed') || 'Please confirm your email first');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Full page navigation — middleware handles role-based routing
      // (admin → /dashboard, teacher → /teacher, student → /student)
      window.location.href = '/';
    } catch {
      setError(t('invalidCredentials') || 'Invalid email or password');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-error-container/30 border border-error/20 rounded-xl text-error text-sm font-medium">{error}</div>
      )}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ms-1" htmlFor="email">
          {t('email')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline text-[22px] group-focus-within:text-primary transition-colors">badge</span>
          </div>
          <input id="email" type="email" required
            className="block w-full ps-12 pe-4 h-11 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-mono placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="admin@school.ma" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
            {t('password')}
          </label>
          <Link href="/reset-password" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline text-[22px] group-focus-within:text-primary transition-colors">lock</span>
          </div>
          <input id="password" type={showPassword ? 'text' : 'password'} required
            className="block w-full ps-12 pe-12 h-11 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-mono placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="button" className="absolute inset-y-0 end-0 pe-4 flex items-center" onClick={() => setShowPassword(!showPassword)}>
            <span className="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)}
          className="w-5 h-5 rounded border-surface-container-high bg-surface-container-low text-primary focus:ring-primary/30" />
        <label htmlFor="remember" className="text-sm text-on-surface-variant font-medium select-none">
          {t('rememberMe')}
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="w-full h-11 luxury-gradient text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><span>{t('signIn')}</span>
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform">arrow_forward</span></>
        )}
      </button>
    </form>
  );
}
