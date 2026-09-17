'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function SignupForm() {
  const t = useTranslations('auth');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    if (field === 'name') {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setForm((prev) => ({
        ...prev,
        name: value,
        ...(slugManuallyEdited ? {} : { slug: autoSlug }),
      }));
    } else if (field === 'slug') {
      setSlugManuallyEdited(true);
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setForm((prev) => ({ ...prev, slug: sanitized }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/onboard-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey!,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Map common backend errors to user-friendly messages
        const errMsg = (data.error || '').toLowerCase();
        if (errMsg.includes('already') || errMsg.includes('duplicate') || errMsg.includes('exists')) {
          setError(t('emailAlreadyExists') || 'An account with this email already exists. Please log in instead.');
        } else if (errMsg.includes('slug')) {
          setError(t('slugTaken') || 'This URL identifier is already taken. Please choose another.');
        } else {
          setError(data.error || t('error') || 'An error occurred');
        }
        setLoading(false);
        return;
      }

      // Auto-login after signup
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        window.location.href = '/login';
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError(t('error') || 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/20 text-error text-sm font-medium animate-in fade-in zoom-in duration-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Institution Name */}
        <div className="space-y-2">
          <label htmlFor="institution_name" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
            {t('institutionName')}
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">domain</span>
            <input
              id="institution_name"
              type="text"
              className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
              placeholder="Ex: Centre Excellence"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
        </div>

        {/* URL Slug — clean inline prefix design */}
        <div className="space-y-2">
          <label htmlFor="slug" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
            {t('uniqueUrl')}
          </label>
          <div className="flex items-center h-11 bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary transition-all">
            <span className="shrink-0 ps-4 pe-2 text-outline text-xs font-bold select-none whitespace-nowrap">
              tadriss.com/
            </span>
            <input
              id="slug"
              type="text"
              className="flex-1 h-full pe-4 bg-transparent text-sm font-bold tracking-wider font-mono placeholder:text-outline outline-none border-none focus:ring-0"
              placeholder="mon-ecole"
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
            />
          </div>
          {form.slug && (
            <p className="text-[11px] text-outline font-medium ps-1">
              <span className="opacity-60">tadriss.com/</span><span className="text-primary font-bold">{form.slug}</span>
            </p>
          )}
        </div>

        {/* Admin Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="first_name" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
              {t('firstName')}
            </label>
            <input
              id="first_name"
              type="text"
              className="w-full h-11 px-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
              placeholder="Mohamed"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="last_name" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
              {t('lastName')}
            </label>
            <input
              id="last_name"
              type="text"
              className="w-full h-11 px-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
              placeholder="Alami"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Admin Email */}
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
            {t('email')}
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">alternate_email</span>
            <input
              id="signup-email"
              type="email"
              className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
              placeholder="admin@school.ma"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] ms-1">
            {t('password')}
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">lock</span>
            <input
              id="signup-password"
              type="password"
              className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-bold font-mono tracking-widest focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-outline outline-none"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 luxury-gradient text-white font-headline font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
      >
        <span>{t('createInstitution')}</span>
        {!loading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>}
        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      </button>
    </form>
  );
}
