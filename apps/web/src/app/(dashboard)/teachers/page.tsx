'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [lastPassword, setLastPassword] = useState('');
  const [role, setRole] = useState<string>('');
  const supabase = createClient();
  const toast = useToast();

  async function loadTeachers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setRole(profile.role);
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });
    setTeachers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadTeachers(); }, []);

    async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          role: 'teacher',
        },
      });

      if (invokeError) {
        console.error('Edge Function Error:', invokeError);
        toast.error(invokeError.message || "Erreur lors de la création de l'enseignant.");
        return;
      }

      toast.success(data.message || 'Enseignant invité avec succès');
      setModalOpen(false);
      setForm({ first_name: '', last_name: '', email: '' });
      loadTeachers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (row: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.first_name} {row.last_name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'is_active',
      label: 'Status',
      render: (row: Teacher) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row: Teacher) => new Date(row.created_at).toLocaleDateString('fr-FR'),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your teaching staff</p>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        searchPlaceholder="Search teachers..."
        emptyMessage="No teachers yet. Invite your first teacher."
        actions={
          role === 'institution_admin' ? (
            <button
              onClick={() => { setModalOpen(true); setLastPassword(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Teacher
            </button>
          ) : undefined
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Teacher">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="teacher@school.ma" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
