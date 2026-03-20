'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
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
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-layout">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span className="auth-logo">Tadriss</span>
          <h1>E-mail envoyé</h1>
          <p className="subtitle" style={{ marginBottom: '24px' }}>
            Si un compte existe avec l&apos;adresse <strong>{email}</strong>,
            vous recevrez un lien de réinitialisation.
          </p>
          <Link href="/login" className="btn btn-primary btn-full btn-lg">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <span className="auth-logo">Tadriss</span>
        <h1>Mot de passe oublié</h1>
        <p className="subtitle">Entrez votre e-mail pour recevoir un lien de réinitialisation</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email" className="form-label">Adresse e-mail</label>
            <input
              id="reset-email"
              type="email"
              className="form-input"
              placeholder="admin@etablissement.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link href="/login" style={{ color: 'var(--color-text-secondary)' }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
