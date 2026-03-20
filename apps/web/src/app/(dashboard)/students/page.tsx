'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string>('');
  const supabase = createClient();
  const toast = useToast();

  async function loadStudents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setRole(profile.role);
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          role: 'student',
        },
      });

      if (invokeError) {
        console.error('Edge Function Error:', invokeError);
        toast.error(invokeError.message || "Erreur lors de la création de l'élève.");
        return;
      }

      toast.success(data.message || 'Élève ajouté avec succès');
      setModalOpen(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '' });
      loadStudents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(student: Student) {
    await supabase.from('profiles').update({ is_active: !student.is_active }).eq('id', student.id);
    loadStudents();
  }

  const columns = [
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (row: Student) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
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
      render: (row: Student) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Enrolled',
      sortable: true,
      render: (row: Student) => new Date(row.created_at).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      label: '',
      render: (row: Student) => role === 'institution_admin' ? (
        <button
          onClick={() => toggleActive(row)}
          className="text-xs font-medium text-slate-500 hover:text-primary transition-colors"
        >
          {row.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ) : null,
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all enrolled students</p>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search students..."
        emptyMessage="No students yet. Add your first student."
        actions={
          role === 'institution_admin' ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add Student
            </button>
          ) : undefined
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Student">
        <form onSubmit={handleCreate} className="space-y-4">
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
