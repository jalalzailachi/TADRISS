'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface Payment {
  id: string;
  student_name: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  status: string;
  period_label: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ student_id: '', amount: '', payment_method: 'cash', period_label: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClient();
  const toast = useToast();

  async function loadPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*, student:profiles!payments_student_id_fkey(first_name, last_name)')
      .order('payment_date', { ascending: false });

    const mapped = (data ?? []).map((p: any) => ({
      id: p.id,
      student_name: p.student ? `${p.student.first_name} ${p.student.last_name}` : '—',
      amount: Number(p.amount),
      currency: p.currency ?? 'MAD',
      payment_date: p.payment_date,
      payment_method: p.payment_method ?? '—',
      status: p.status ?? 'recorded',
      period_label: p.period_label ?? '—',
    }));
    setPayments(mapped);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'student').eq('is_active', true);
    setStudents(data ?? []);
  }

  useEffect(() => { loadPayments(); loadStudents(); }, []);

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = user?.app_metadata?.institution_id;

      const { error } = await supabase.from('payments').insert({
        institution_id: institutionId,
        student_id: form.student_id,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
        payment_date: new Date().toISOString().split('T')[0],
        period_label: form.period_label,
        notes: form.notes,
        status: 'recorded',
        recorded_by: user?.id,
      });

      if (error) throw error;
      toast.success('Payment recorded');
      setModalOpen(false);
      setForm({ student_id: '', amount: '', payment_method: 'cash', period_label: '', notes: '' });
      loadPayments();
    } catch (err: any) {
      toast.error(err.message || 'Error recording payment');
    }
    setSaving(false);
  }

  // Summary calculations
  const totalCollected = payments.filter((p) => p.status === 'recorded' || p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;

  const filtered = statusFilter === 'all' ? payments : payments.filter((p) => p.status === statusFilter);

  const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (s) {
      case 'recorded': case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      case 'voided': return 'neutral';
      default: return 'neutral';
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (row: Payment) => (
        <span className="font-semibold text-slate-900">{row.amount.toLocaleString('fr-FR')} {row.currency}</span>
      ),
    },
    {
      key: 'payment_date',
      label: 'Date',
      sortable: true,
      render: (row: Payment) => new Date(row.payment_date).toLocaleDateString('fr-FR'),
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (row: Payment) => <span className="capitalize">{row.payment_method}</span>,
    },
    { key: 'period_label', label: 'Period' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Payment) => (
        <Badge variant={statusVariant(row.status)}>
          {row.status === 'recorded' ? 'Paid' : row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Track payments and generate receipts</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Collected</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{totalCollected.toLocaleString('fr-FR')} MAD</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase">Pending</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{totalPending.toLocaleString('fr-FR')} MAD</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase">Overdue</p>
          <p className="text-xl font-bold text-red-700 mt-1">{overdueCount} payments</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'recorded', 'pending', 'overdue', 'voided'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s === 'recorded' ? 'Paid' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search payments..."
        emptyMessage="No payments found."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add_card</span>
            Record Payment
          </button>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <form onSubmit={handleRecord} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
            <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (MAD)</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
            <input value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="e.g. October 2024"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors">
              {saving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
