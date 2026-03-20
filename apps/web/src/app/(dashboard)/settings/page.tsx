'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

type Tab = 'institution' | 'fees' | 'academic';

interface Fee {
  id: string;
  label: string;
  amount: number;
  class_name: string;
  class_id: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('institution');
  const [form, setForm] = useState({ name: '', slug: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState<Fee[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeModal, setFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ label: '', amount: '', class_id: '' });
  const supabase = createClient();
  const toast = useToast();

  async function loadInstitution() {
    const { data: { user } } = await supabase.auth.getUser();
    const institutionId = user?.app_metadata?.institution_id;
    if (!institutionId) return;

    const { data } = await supabase.from('institutions').select('*').eq('id', institutionId).single();
    if (data) {
      setForm({
        name: data.name ?? '',
        slug: data.slug ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
      });
    }
    setLoading(false);
  }

  async function loadFees() {
    const { data } = await supabase
      .from('enrollment_fees')
      .select('*, classes(name)')
      .order('created_at', { ascending: false });
    setFees((data ?? []).map((f: any) => ({
      id: f.id,
      label: f.label ?? '—',
      amount: Number(f.amount),
      class_name: f.classes?.name ?? 'All',
      class_id: f.class_id ?? '',
    })));
  }

  async function loadClasses() {
    const { data } = await supabase.from('classes').select('id, name').eq('is_active', true);
    setClasses(data ?? []);
  }

  useEffect(() => { loadInstitution(); loadFees(); loadClasses(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = user?.app_metadata?.institution_id;
      const { error } = await supabase.from('institutions').update({
        name: form.name, email: form.email, phone: form.phone, address: form.address,
      }).eq('id', institutionId);
      if (error) throw error;
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  async function handleAddFee(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = user?.app_metadata?.institution_id;
      const { error } = await supabase.from('enrollment_fees').insert({
        institution_id: institutionId,
        label: feeForm.label,
        amount: parseFloat(feeForm.amount),
        class_id: feeForm.class_id || null,
      });
      if (error) throw error;
      toast.success('Fee added');
      setFeeModal(false);
      setFeeForm({ label: '', amount: '', class_id: '' });
      loadFees();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteFee(id: string) {
    await supabase.from('enrollment_fees').delete().eq('id', id);
    loadFees();
    toast.success('Fee removed');
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'institution', label: 'Institution', icon: 'business' },
    { key: 'fees', label: 'Enrollment Fees', icon: 'payments' },
    { key: 'academic', label: 'Academic Year', icon: 'calendar_month' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your institution configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Institution Tab */}
      {tab === 'institution' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
              <input disabled value={form.slug}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Fees Tab */}
      {tab === 'fees' && (
        <>
          <DataTable
            columns={[
              { key: 'label', label: 'Fee Label', sortable: true },
              { key: 'class_name', label: 'Class' },
              {
                key: 'amount', label: 'Amount', sortable: true,
                render: (row: Fee) => <span className="font-semibold">{row.amount.toLocaleString('fr-FR')} MAD</span>,
              },
              {
                key: 'actions', label: '',
                render: (row: Fee) => (
                  <button onClick={() => deleteFee(row.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                ),
              },
            ]}
            data={fees}
            emptyMessage="No enrollment fees configured."
            actions={
              <button onClick={() => setFeeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
                Add Fee
              </button>
            }
          />
          <Modal open={feeModal} onClose={() => setFeeModal(false)} title="Add Enrollment Fee" size="sm">
            <form onSubmit={handleAddFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input required value={feeForm.label} onChange={(e) => setFeeForm({ ...feeForm, label: e.target.value })} placeholder="e.g. Monthly Tuition"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (MAD)</label>
                <input type="number" step="0.01" required value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class (optional)</label>
                <select value={feeForm.class_id} onChange={(e) => setFeeForm({ ...feeForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFeeModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover">Add Fee</button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* Academic Year Tab */}
      {tab === 'academic' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Year</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year Label</label>
              <input defaultValue="2024/2025" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select defaultValue="active" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input type="date" defaultValue="2024-09-02" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input type="date" defaultValue="2025-06-30" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <button className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors">
            Save Academic Year
          </button>
        </div>
      )}
    </>
  );
}
