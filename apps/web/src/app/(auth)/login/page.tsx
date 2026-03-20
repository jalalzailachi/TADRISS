'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect'
            : authError.message
        );
        return;
      }

      // Fetch the profile to get role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Role-based redirect
      if (profile.role === 'institution_admin') router.push('/dashboard');
      else if (profile.role === 'teacher') router.push('/teacher');
      else if (profile.role === 'student') router.push('/student');
      else router.push('/');

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="auth-logo">Tadriss</span>
        <h1>Connexion</h1>
        <p className="subtitle">Accédez au tableau de bord de votre établissement</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@etablissement.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link href="/reset-password" style={{ color: 'var(--color-text-secondary)' }}>
            Mot de passe oublié ?
          </Link>
          <span style={{ margin: '0 8px', color: 'var(--color-text-muted)' }}>·</span>
          <Link href="/signup">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
