'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from institution name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setForm((prev) => ({ ...prev, name: value, slug }));
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
        setError(data.error || 'Erreur lors de la création du compte');
        return;
      }

      // Auto-login after signup
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      router.push('/');
      router.refresh();
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="auth-logo">Tadriss</span>
        <h1>Créer un compte</h1>
        <p className="subtitle">Inscrivez votre établissement en quelques secondes</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="institution_name" className="form-label">Nom de l&apos;établissement</label>
            <input
              id="institution_name"
              type="text"
              className="form-input"
              placeholder="Centre Prépa Excellence"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug" className="form-label">Identifiant URL</label>
            <input
              id="slug"
              type="text"
              className="form-input"
              placeholder="centre-prepa-excellence"
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">Prénom</label>
              <input
                id="first_name"
                type="text"
                className="form-input"
                placeholder="Mohamed"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name" className="form-label">Nom</label>
              <input
                id="last_name"
                type="text"
                className="form-input"
                placeholder="Benani"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">E-mail</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="admin@etablissement.ma"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Mot de passe</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min. 6 caractères"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer mon établissement'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Déjà un compte ? </span>
          <Link href="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
