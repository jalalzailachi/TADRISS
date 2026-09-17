'use client';

import { useEffect, useState, useTransition } from 'react';
import { getErrorMessage } from '@/lib/errors'
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { addEnrollmentFee } from '@/app/actions/user';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';

type Tab = 'institution' | 'fees' | 'academic';

interface Fee {
  id: string;
  label: string;
  amount: number;
  class_name: string;
  class_id: string;
  student_name?: string;
}

export default function SettingsPage() {
  const common = useTranslations('common');
  const nav = useTranslations('nav');
  const t = useTranslations('settings');
  const [tab, setTab] = useState<Tab>('institution');
  const [form, setForm] = useState({ name: '', slug: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState<Fee[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [feeModal, setFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({ label: '', amount: '', class_id: '', student_id: '' });
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const toast = useToast();

  async function loadInstitution() {
    const { data: { user } } = await supabase.auth.getUser();
    const institutionId = user?.app_metadata?.institution_id;
    if (!institutionId) return;

    // No select('*') — name columns explicitly to avoid exposing sensitive fields
    const { data } = await supabase.from('institutions').select('id, name, slug, email, phone, address').eq('id', institutionId).single();
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
    const { data: { user: u } } = await supabase.auth.getUser();
    const instId = u?.app_metadata?.institution_id;
    if (!instId) return;
    const { data } = await supabase
      .from('enrollment_fees')
      .select('*, classes(name), student:profiles!enrollment_fees_student_id_fkey(first_name, last_name)')
      .eq('institution_id', instId)
      .order('created_at', { ascending: false });
    type FeeRow = {
      id: string
      label: string | null
      amount: number | string
      classes: { name: string } | null
      class_id: string | null
      student: { first_name: string; last_name: string } | null
    }
    setFees(((data ?? []) as unknown as FeeRow[]).map((f) => ({
      id: f.id,
      label: f.label ?? '—',
      amount: Number(f.amount),
      class_name: f.classes?.name ?? t('allClasses'),
      class_id: f.class_id ?? '',
      student_name: f.student ? `${f.student.first_name} ${f.student.last_name}` : '—',
    })));
  }

  async function loadClasses() {
    const { data: { user: u } } = await supabase.auth.getUser();
    const instId = u?.app_metadata?.institution_id;
    if (!instId) return;
    const { data } = await supabase.from('classes').select('id, name').eq('institution_id', instId).eq('is_active', true);
    setClasses(data ?? []);
  }

  async function loadStudents() {
    const { data: { user: u } } = await supabase.auth.getUser();
    const instId = u?.app_metadata?.institution_id;
    if (!instId) return;
    const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('institution_id', instId).eq('role', 'student').is('deleted_at', null);
    setStudents(data ?? []);
  }

  useEffect(() => {
    loadInstitution();
    loadFees();
    loadClasses();
    loadStudents();
    // Run once on mount; the loaders read auth/institution at call time and
    // do not depend on any reactive value that should re-trigger them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      toast.success(common('save'));
    } catch (err) { toast.error(getErrorMessage(err)); }
    setSaving(false);
  }

  async function handleAddFee(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append('label', feeForm.label);
      formData.append('amount', feeForm.amount);
      formData.append('class_id', feeForm.class_id);
      formData.append('student_id', feeForm.student_id);

      const result = await addEnrollmentFee(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('feeAdded'));
        setFeeModal(false);
        setFeeForm({ label: '', amount: '', class_id: '', student_id: '' });
        loadFees();
      }
    });
  }

  async function deleteFee(id: string) {
    await supabase.from('enrollment_fees').delete().eq('id', id);
    loadFees();
    toast.success(t('feeDeleted'));
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 anim-in">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{t('loading')}</span>
        <span className="text-[9px] font-bold text-outline/40 uppercase tracking-widest">{t('loadingDesc')}</span>
      </div>
    </div>
  );

  const feeColumns = [
    {
      key: 'label',
      label: t('feeLabel'),
      render: (row: Fee) => (
        <span className="text-sm font-black text-on-surface uppercase tracking-tight">{row.label}</span>
      )
    },
    {
      key: 'student_name',
      label: t('feeStudent'),
      render: (row: Fee) => (
        <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{row.student_name}</span>
      )
    },
    {
      key: 'class_name',
      label: t('feeClass'),
      render: (row: Fee) => (
        <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">{row.class_name}</span>
      )
    },
    {
      key: 'amount',
      label: t('feeAmount'),
      render: (row: Fee) => (
        <span className="text-base font-black text-on-surface tabular-nums">{row.amount.toLocaleString()} <span className="text-[10px] opacity-40 italic">{common('currency')}</span></span>
      )
    },
    {
       key: 'actions',
       label: '',
       render: (row: Fee) => (
         <div className="flex justify-end pe-2">
            <button onClick={() => deleteFee(row.id)} className="w-9 h-9 rounded-xl bg-surface-container-high/50 border border-outline-variant/10 text-outline hover:bg-danger hover:text-white transition-all flex items-center justify-center shadow-sm">
               <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
         </div>
       )
    }
  ];

  return (
    <div className="space-y-10">
      <PageHeader 
        title={nav('settings')} 
        subtitle={t('subtitle')}
        count="Operational Alpha"
        action={
          <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high/50 rounded-2xl border border-outline-variant/10 shadow-sm backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{t('syncActive')}</span>
          </div>
        }
      />

      {/* Premium Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 shadow-sm w-fit anim-in">
        {[
          { key: 'institution', label: t('tabInstitution'), icon: 'business' },
          { key: 'fees', label: t('tabFees'), icon: 'payments' },
          { key: 'academic', label: t('tabAcademic'), icon: 'calendar_today' },
        ].map((t_) => (
          <button
            key={t_.key}
            onClick={() => setTab(t_.key as Tab)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest
              ${tab === t_.key 
                ? 'bg-on-surface text-surface shadow-lg scale-[1.02]' 
                : 'text-outline-variant hover:text-on-surface hover:bg-surface-container-high/50'}
            `}
          >
            <span className="material-symbols-outlined text-[18px]">{t_.icon}</span>
            {t_.label}
            {tab === t_.key && <span className="w-1.5 h-1.5 rounded-full bg-primary ms-1"></span>}
          </button>
        ))}
      </div>

      <div className="anim-in">
        {tab === 'institution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSave} className="lg:col-span-2 bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant/5 shadow-sm space-y-10">
              <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-8">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-3xl">domain</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">{t('institutionalProfile')}</h3>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1 opacity-60">{t('profileDesc')}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('instName')}</label>
                  <div className="relative group">
                     <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">edit_note</span>
                     <input 
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('slug')}</label>
                  <div className="relative group">
                     <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline/30 text-[22px] pointer-events-none">link_off</span>
                     <input 
                      disabled
                      value={form.slug}
                      className="w-full h-11 ps-12 pe-4 bg-surface-container-high opacity-50 border border-outline-variant/10 rounded-2xl text-sm font-bold text-outline cursor-not-allowed italic" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('contactEmail')}</label>
                  <div className="relative group">
                     <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">alternate_email</span>
                     <input 
                      name="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('phone')}</label>
                  <div className="relative group">
                     <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">call</span>
                     <input 
                      name="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('address')}</label>
                <div className="relative group">
                   <span className="material-symbols-outlined absolute start-4 top-4 text-outline group-focus-within:text-primary transition-colors text-[22px] pointer-events-none">map</span>
                   <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3}
                    className="w-full ps-12 pe-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none min-h-[120px]" />
                </div>
              </div>
              <div className="pt-8 border-t border-outline-variant/10 flex justify-end">
                 <button type="submit" disabled={saving} className="h-11 px-10 bg-on-surface text-surface rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
                    {saving && <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
                    {common('save')}
                 </button>
              </div>
            </form>

            <div className="space-y-8">
               <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/5 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <span className="material-symbols-outlined text-primary">verified_user</span>
                     <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">{t('brandIdentity')}</h4>
                  </div>
                  <div className="aspect-square rounded-2xl bg-surface-container-high border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-6 group cursor-pointer hover:border-primary/50 transition-all bg-linear-to-br from-surface-container-high to-surface-container-low">
                     <div className="w-16 h-16 rounded-3xl bg-surface-container-highest flex items-center justify-center mb-4 shadow-sm border border-outline-variant/10">
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl">upload_file</span>
                     </div>
                     <p className="text-xs font-black text-on-surface uppercase tracking-tight mb-1">{t('updateLogo')}</p>
                     <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">{t('logoFormat')}</p>
                  </div>
               </div>

               <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 border-dashed relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4 relative z-10">{t('quickStats')}</p>
                  <div className="space-y-4 relative z-10">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-outline uppercase tracking-tight opacity-60">{t('dataCapacity')}</span>
                        <span className="text-[10px] font-black text-on-surface uppercase italic">{t('unlimited')}</span>
                     </div>
                     <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                        <div className="w-1/3 h-full bg-primary rounded-full transition-all duration-1000"></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {tab === 'fees' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
               <div>
                  <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight italic">{t('tuitionProtocols')}</h3>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1 opacity-60">{t('tuitionDesc')}</p>
               </div>
               <button onClick={() => setFeeModal(true)} className="h-12 px-8 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  {t('feeAdd')}
               </button>
            </div>
            
            <DataTable 
               data={fees}
               columns={feeColumns}
               emptyMessage={t('feeEmpty')}
               itemsPerPage={12}
            />
          </div>
        )}

        {tab === 'academic' && (
          <div className="bg-on-surface p-24 text-center rounded-[64px] border border-on-surface relative overflow-hidden group shadow-2xl shadow-on-surface/20">
            <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-primary/20 blur-[180px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-primary/30 transition-colors"></div>
            <div className="absolute -bottom-32 -start-32 w-96 h-96 bg-accent/10 blur-[120px] rounded-full"></div>

            <div className="relative z-10">
               <div className="w-28 h-28 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-10 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-6xl text-white opacity-40 group-hover:opacity-100 transition-opacity">history_edu</span>
               </div>
               <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-6 italic leading-tight">{t('academicTitle')}</h3>
               <div className="inline-flex items-center gap-4 px-10 py-3 bg-white/10 text-white rounded-full mb-12 border border-white/20 backdrop-blur-md shadow-xl">
                  <span className="w-3 h-3 rounded-full bg-tertiary animate-pulse shadow-lg shadow-tertiary/50"></span>
                  <span className="text-sm font-black uppercase tracking-[0.3em]">{t('sessionLabel')}: 2024 / 2025</span>
               </div>
               <div className="max-w-md mx-auto p-1.5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm shadow-inner flex items-center">
                  <div className="flex-1 px-10 py-4 bg-white text-on-surface rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    {t('activeYear')}
                  </div>
                  <button disabled className="px-10 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest italic cursor-not-allowed flex items-center gap-2" title={t('endEpochComingSoon')}>
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    {t('endEpoch')}
                    <span className="text-[7px] font-bold bg-white/10 text-white/30 px-2 py-0.5 rounded-full border border-white/5 not-italic">{t('endEpochComingSoon')}</span>
                  </button>
               </div>
            </div>
            
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
        )}
      </div>

      <Modal open={feeModal} onClose={() => setFeeModal(false)} title={t('feeAssign')} size="md">
        <form onSubmit={handleAddFee} className="space-y-8 p-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeStudent')}</label>
            <div className="relative group">
               <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">person</span>
               <select required value={feeForm.student_id} onChange={(e) => setFeeForm({ ...feeForm, student_id: e.target.value })}
                className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                <option value="">{t('selectStudent')}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
               <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeLabel')}</label>
            <div className="relative group">
               <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">receipt</span>
               <input required value={feeForm.label} onChange={(e) => setFeeForm({ ...feeForm, label: e.target.value })} placeholder="e.g. Monthly Tuition Fee"
                className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
               <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeAmount')} ({common('currency')})</label>
               <div className="relative group">
                  <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">payments</span>
                  <input type="number" required value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                   className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-lg font-black tabular-nums focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" />
               </div>
             </div>
             <div className="space-y-3">
               <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeClass')} ({common('optional')})</label>
               <div className="relative group">
                  <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">school</span>
                  <select value={feeForm.class_id} onChange={(e) => setFeeForm({ ...feeForm, class_id: e.target.value })}
                   className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                   <option value="">{t('allClasses')}</option>
                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                  <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
               </div>
             </div>
          </div>
          <div className="flex justify-end gap-4 pt-10 border-t border-outline-variant/10">
            <button type="button" onClick={() => setFeeModal(false)} className="h-11 px-8 rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all">{common('cancel')}</button>
            <button type="submit" disabled={isPending} className="h-11 px-10 bg-on-surface text-surface rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
               {isPending && <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />}
               {t('authorizeProtocol')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
