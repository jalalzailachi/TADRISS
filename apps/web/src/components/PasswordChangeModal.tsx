'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function PasswordChangeModal({ open, onClose, userId }: PasswordChangeModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // 1. Update auth password
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) throw authError;

      // 2. Clear the must_change_password flag in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('Password updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={() => {}} // Force user to change password by disabling close if needed, but for UX we'll keep it simple
      title="Security Update Required"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800 font-medium">
            For security reasons, you must change your temporary password before continuing.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password & Continue'}
        </button>
      </form>
    </Modal>
  );
}
