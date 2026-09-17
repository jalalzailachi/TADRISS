'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { recordPayment, voidPayment, addFee, addBulkClassFee, deleteFee } from './actions'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Database } from '@tadriss/shared'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'

/* ── Types ────────────────────────────────────────────────── */

type Payment = Database['public']['Tables']['payments']['Row'] & {
  student: { id: string; first_name: string; last_name: string } | null
}

type Student = { id: string; first_name: string; last_name: string }
type ClassItem = { id: string; name: string }

export type Fee = {
  id: string; label: string | null; amount: number; period_type: string
  is_active: boolean; created_at: string; class_id: string | null; student_id: string
  student: { id: string; first_name: string; last_name: string } | null
  class: { id: string; name: string } | null
}

type Tab = 'payments' | 'fees' | 'overview'

interface Props {
  initialPayments: Payment[]
  totalCount: number
  currentPage: number
  pageSize: number
  students: Student[]
  stats: { monthly_revenue: number; active_students: number }
  fees: Fee[]
  classes: ClassItem[]
  monthlyRevenue: { month: string; amount: number }[]
  collectionRate: number
  activeFeeCount: number
  initialTab: Tab
}

/* ── Component ────────────────────────────────────────────── */

export function FinanceClient({
  initialPayments, totalCount, currentPage, pageSize,
  students, stats, fees, classes,
  monthlyRevenue, collectionRate, activeFeeCount, initialTab,
}: Props) {
  const t = useTranslations('payments')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showBulkFeeModal, setShowBulkFeeModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)
  const [deleteFeeTarget, setDeleteFeeTarget] = useState<Fee | null>(null)
  const [payFromFee, setPayFromFee] = useState<Fee | null>(null)
  const [feeFilter, setFeeFilter] = useState<'all' | 'active' | 'paid'>('all')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(currentQuery)

  function switchTab(t: Tab) {
    setTab(t)
    const params = new URLSearchParams(searchParams)
    params.set('tab', t)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (val: string) => {
    setSearchQuery(val)
    const params = new URLSearchParams(searchParams)
    if (val) params.set('q', val); else params.delete('q')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleRecordPayment(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await recordPayment(formData)
      if (res?.error) { setError(res.error); return }
      setShowPaymentModal(false)
      setPayFromFee(null)
    })
  }

  async function handleVoidPayment() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await voidPayment(deleteTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteTarget(null)
    })
  }

  async function handleAddFee(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await addFee(formData)
      if (res?.error) { setError(res.error); return }
      setShowFeeModal(false)
    })
  }

  async function handleBulkFee(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await addBulkClassFee(formData)
      if (res?.error) { setError(res.error); return }
      setShowBulkFeeModal(false)
    })
  }

  async function handleDeleteFee() {
    if (!deleteFeeTarget) return
    startTransition(async () => {
      const res = await deleteFee(deleteFeeTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteFeeTarget(null)
    })
  }

  /* ── Filtered fees ─────────────── */
  const filteredFees = fees.filter(f => {
    if (feeFilter === 'active') return f.is_active
    if (feeFilter === 'paid') return !f.is_active
    return true
  })

  /* ── Payment columns ─────────── */
  const paymentColumns = [
    {
      key: 'student', label: t('student'),
      render: (p: Payment) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-black text-sm border border-primary/20 uppercase">
            {p.student?.first_name?.[0]}{p.student?.last_name?.[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-on-surface uppercase tracking-tight">{p.student?.first_name} {p.student?.last_name}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60">{p.period_label || t('directPayment')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount', label: t('amount'),
      render: (p: Payment) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-on-surface tabular-nums uppercase">{Number(p.amount).toLocaleString()} {tc('currency')}</span>
          <div className="flex items-center gap-1 text-[10px] text-outline font-bold uppercase tracking-tight opacity-60">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            {p.payment_method && t(p.payment_method as Parameters<typeof t>[0])}
          </div>
        </div>
      ),
    },
    {
      key: 'date', label: t('date'),
      render: (p: Payment) => (
        <p className="text-[11px] font-black text-outline uppercase tracking-tight opacity-70">
          {new Date(p.payment_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      ),
    },
    {
      key: 'status', label: t('status'),
      render: (p: Payment) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
          ${p.status === 'recorded'
            ? 'bg-success-soft border-on-success-soft/10 text-on-success-soft'
            : 'bg-error-soft border-on-error-soft/10 text-on-error-soft'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'recorded' ? 'bg-tertiary' : 'bg-error'}`} />
          {p.status && t(p.status as Parameters<typeof t>[0])}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (p: Payment) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {p.status === 'recorded' && (
            <button onClick={() => setDeleteTarget(p)} className="w-9 h-9 rounded-xl text-outline hover:text-error hover:bg-error/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">block</span>
            </button>
          )}
        </div>
      ),
    },
  ]

  /* ── Fee columns ─────────────── */
  const feeColumns = [
    {
      key: 'student', label: t('student'),
      render: (f: Fee) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary font-black text-[10px] border border-secondary/20 uppercase">
            {f.student?.first_name?.[0]}{f.student?.last_name?.[0]}
          </div>
          <span className="text-sm font-black text-on-surface uppercase tracking-tight">
            {f.student?.first_name} {f.student?.last_name}
          </span>
        </div>
      ),
    },
    {
      key: 'label', label: t('feeLabel'),
      render: (f: Fee) => (
        <span className="text-xs font-bold text-outline uppercase tracking-widest">{f.label || '—'}</span>
      ),
    },
    {
      key: 'class', label: t('feeClass'),
      render: (f: Fee) => (
        <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-80">
          {f.class?.name || '—'}
        </span>
      ),
    },
    {
      key: 'amount', label: t('amount'),
      render: (f: Fee) => (
        <span className="text-sm font-black text-on-surface tabular-nums">
          {Number(f.amount).toLocaleString()} <span className="text-[10px] opacity-40 italic">{tc('currency')}</span>
        </span>
      ),
    },
    {
      key: 'status', label: t('status'),
      render: (f: Fee) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
          ${f.is_active
            ? 'bg-warning-soft border-on-warning-soft/10 text-on-warning-soft'
            : 'bg-success-soft border-on-success-soft/10 text-on-success-soft'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-secondary' : 'bg-tertiary'}`} />
          {f.is_active ? t('pending') : t('paid')}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (f: Fee) => (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {f.is_active && (
            <button
              onClick={() => { setPayFromFee(f); setShowPaymentModal(true); setError('') }}
              className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-success-soft border border-on-success-soft/10 text-on-success-soft hover:bg-success-soft/80 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_card</span>
              {t('recordPayment')}
            </button>
          )}
          <button onClick={() => setDeleteFeeTarget(f)} className="w-9 h-9 rounded-xl text-outline hover:text-error hover:bg-error/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>
      ),
    },
  ]

  /* ── Chart colors ─────────────── */
  const CHART_COLORS = ['var(--color-primary)', 'var(--color-outline-variant)']

  const pieData = [
    { name: t('paid'), value: collectionRate },
    { name: t('pending'), value: 100 - collectionRate },
  ]

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        count={totalCount.toString()}
        action={
          <div className="flex items-center gap-3">
            {tab === 'payments' && (
              <>
                <div className="relative group hidden md:block">
                  <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">search</span>
                  <input
                    type="text" placeholder={tc('search')}
                    value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                    className="w-64 h-11 ps-11 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
                </div>
                <button onClick={() => { setShowPaymentModal(true); setError('') }}
                  className="h-11 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-[20px]">add_card</span>
                  {t('addPayment')}
                </button>
              </>
            )}
            {tab === 'fees' && (
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowBulkFeeModal(true); setError('') }}
                  className="h-11 px-6 bg-surface-container-high dark:bg-surface-container-highest text-on-surface rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-outline-variant/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-[20px]">group_add</span>
                  {t('bulkClassFee')}
                </button>
                <button onClick={() => { setShowFeeModal(true); setError('') }}
                  className="h-11 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  {t('addFee')}
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/5 shadow-sm w-fit anim-in">
        {([
          { key: 'payments', label: t('tabPayments'), icon: 'payments' },
          { key: 'fees', label: t('tabFees'), icon: 'receipt_long' },
          { key: 'overview', label: t('tabOverview'), icon: 'analytics' },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => switchTab(item.key)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest
              ${tab === item.key
                ? 'bg-on-surface text-surface shadow-lg scale-[1.02]'
                : 'text-outline-variant hover:text-on-surface hover:bg-surface-container-high/50'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            {item.label}
            {tab === item.key && <span className="w-1.5 h-1.5 rounded-full bg-primary ms-1" />}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-xs font-black uppercase tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {/* ═══════════════ TAB: PAYMENTS ═══════════════ */}
      {tab === 'payments' && (
        <div className="space-y-8 anim-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-3xl border border-outline-variant/5 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success-soft text-on-success-soft flex items-center justify-center border border-on-success-soft/10">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <span className="text-[10px] font-black text-on-success-soft uppercase tracking-widest bg-success-soft px-2 py-0.5 rounded-full border border-on-success-soft/10">{t('verified')}</span>
                </div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-1 opacity-70">{t('monthlyRevenue')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface tabular-nums tracking-tighter counter-animate">{stats.monthly_revenue.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-outline uppercase">{tc('currency')}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-3xl border border-outline-variant/5 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning-soft text-on-warning-soft flex items-center justify-center border border-on-warning-soft/10">
                    <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                  </div>
                  <span className="text-[10px] font-black text-on-warning-soft uppercase tracking-widest bg-warning-soft px-2 py-0.5 rounded-full border border-on-warning-soft/10">{t('pending')}</span>
                </div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-1 opacity-70">{t('outstandingFees')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface tabular-nums tracking-tighter counter-animate">{activeFeeCount}</span>
                  <span className="text-[10px] font-black text-outline uppercase">{t('tabFees')}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low dark:bg-surface-container-high p-6 rounded-3xl border border-outline-variant/10 shadow-sm border-dashed flex items-center justify-center text-center opacity-60 hover:opacity-100 cursor-pointer transition-all gap-3">
              <span className="material-symbols-outlined text-outline text-[20px]">file_download</span>
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{t('generateReport')}</p>
            </div>
          </div>

          <DataTable
            data={initialPayments}
            columns={paymentColumns}
            emptyState={
              <EmptyState icon="payments" title={t('noPayments')} description={t('emptyDescription')}
                action={
                  <button onClick={() => setShowPaymentModal(true)}
                    className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10">
                    {t('addPayment')}
                  </button>
                }
              />
            }
            itemsPerPage={pageSize}
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={handlePageChange}
            totalItems={totalCount}
          />
        </div>
      )}

      {/* ═══════════════ TAB: FEES ═══════════════ */}
      {tab === 'fees' && (
        <div className="space-y-8 anim-in">
          {/* Fee filter pills */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'paid'] as const).map((f) => (
              <button key={f} onClick={() => setFeeFilter(f)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                  ${feeFilter === f
                    ? 'bg-on-surface text-surface border-on-surface shadow-lg'
                    : 'bg-surface-container-lowest dark:bg-surface-container border-outline-variant/10 text-outline hover:text-on-surface'}`}>
                {f === 'all' && t('filterAll')}
                {f === 'active' && t('pending')}
                {f === 'paid' && t('paid')}
                <span className="ms-2 text-[9px] opacity-60">
                  {f === 'all' ? fees.length : f === 'active' ? fees.filter(x => x.is_active).length : fees.filter(x => !x.is_active).length}
                </span>
              </button>
            ))}
          </div>

          <DataTable
            data={filteredFees}
            columns={feeColumns}
            emptyState={
              <EmptyState icon="receipt_long" title={t('noFees')} description={t('feesEmptyDesc')}
                action={
                  <button onClick={() => setShowFeeModal(true)}
                    className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10">
                    {t('addFee')}
                  </button>
                }
              />
            }
            itemsPerPage={15}
          />
        </div>
      )}

      {/* ═══════════════ TAB: OVERVIEW ═══════════════ */}
      {tab === 'overview' && (
        <div className="space-y-8 anim-in">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Revenue Bar Chart */}
            <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">{t('revenueChart')}</h3>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1 opacity-60">{t('last6Months')}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success-soft rounded-lg border border-on-success-soft/10">
                  <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span className="text-[9px] font-black text-on-success-soft uppercase tracking-widest">{t('liveData')}</span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} barCategoryGap="20%">
                    <XAxis
                      dataKey="month" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 800, fill: 'var(--color-outline)' }}
                    />
                    <YAxis
                      axisLine={false} tickLine={false} width={60}
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-outline)' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-surface-container-high)', opacity: 0.5 }}
                      contentStyle={{
                        background: 'var(--color-surface-container-lowest)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 12, fontSize: 12, fontWeight: 800,
                      }}
                      formatter={(value) => [`${Number(value).toLocaleString()} ${tc('currency') || 'MAD'}`, t('monthlyRevenue')]}
                    />
                    <Bar dataKey="amount" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection Rate Donut + Stats */}
            <div className="space-y-8">
              <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/5 shadow-sm text-center">
                <h3 className="text-[10px] font-black text-outline uppercase tracking-widest mb-6">{t('collectionRateTitle')}</h3>
                <div className="h-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        startAngle={90} endAngle={-270}
                        paddingAngle={2} dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-on-surface tabular-nums tracking-tighter">{collectionRate}%</span>
                    <span className="text-[9px] font-black text-outline uppercase tracking-widest">{t('collected')}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-outline uppercase">{t('paid')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-outline-variant" />
                    <span className="text-[10px] font-bold text-outline uppercase">{t('pending')}</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-on-surface p-6 rounded-3xl shadow-xl shadow-on-surface/10 relative overflow-hidden">
                <div className="absolute top-0 end-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full translate-x-8 -translate-y-8" />
                <div className="relative z-10 space-y-5">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('quickNumbers')}</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('totalRevenue')}</span>
                    <span className="text-lg font-black text-white tabular-nums">
                      {monthlyRevenue.reduce((s, m) => s + m.amount, 0).toLocaleString()} <span className="text-[9px] opacity-40">{tc('currency')}</span>
                    </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('outstandingFees')}</span>
                    <span className="text-lg font-black text-secondary tabular-nums">{activeFeeCount}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('activeStudents')}</span>
                    <span className="text-lg font-black text-white tabular-nums">{stats.active_students}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Fees List */}
          {fees.filter(f => f.is_active).length > 0 && (
            <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/5 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-warning-soft text-on-warning-soft flex items-center justify-center border border-on-warning-soft/10">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-on-surface uppercase tracking-tight">{t('outstandingFees')}</h3>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">
                    {fees.filter(f => f.is_active).length} {t('feesRemaining')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {fees.filter(f => f.is_active).slice(0, 10).map(f => (
                  <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container-high border border-outline-variant/5 hover:border-outline-variant/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning-soft text-on-warning-soft flex items-center justify-center text-[10px] font-black uppercase">
                        {f.student?.first_name?.[0]}{f.student?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-surface uppercase tracking-tight">{f.student?.first_name} {f.student?.last_name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">{f.label} {f.class ? `· ${f.class.name}` : ''}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-on-warning-soft tabular-nums">{Number(f.amount).toLocaleString()} {tc('currency')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Record Payment Modal */}
      <Modal open={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPayFromFee(null) }} title={payFromFee ? `${t('recordPayment')} — ${payFromFee.student?.first_name} ${payFromFee.student?.last_name}` : t('recordTransaction')} size="lg">
        <form action={handleRecordPayment} className="space-y-6 p-4">
          {payFromFee && <input type="hidden" name="fee_id" value={payFromFee.id} />}
          {payFromFee && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs font-bold text-primary flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] mt-0.5">receipt_long</span>
              <p>{payFromFee.label} — {Number(payFromFee.amount).toLocaleString()} {tc('currency')}</p>
            </div>
          )}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('student')} *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">person</span>
              <select name="student_id" defaultValue={payFromFee?.student_id || ''} className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                <option value="">{tc('search')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('amount')} ({tc('currency')}) *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">monetization_on</span>
                <input name="amount" type="number" step="10" defaultValue={payFromFee ? Number(payFromFee.amount) : undefined} className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-lg font-black tabular-nums focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required placeholder="00.00" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('date')} *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">event</span>
                <input name="payment_date" type="date" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('method')} *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">account_balance_wallet</span>
                <select name="payment_method" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="cash">{t('cash')}</option>
                  <option value="transfer">{t('transfer')}</option>
                  <option value="check">{t('check')}</option>
                  <option value="other">{t('other')}</option>
                </select>
                <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('period')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">history_toggle_off</span>
                <input name="period_label" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase placeholder:lowercase" placeholder={t('periodPlaceholder')} />
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-8">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="h-11 px-8 rounded-2xl text-sm font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all" disabled={isPending}>{tc('cancel')}</button>
            <button type="submit" className="h-11 px-10 bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3" disabled={isPending}>
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? t('recording') : t('recordPayment')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Fee Modal */}
      <Modal open={showFeeModal} onClose={() => setShowFeeModal(false)} title={t('addFee')} size="md">
        <form action={handleAddFee} className="space-y-6 p-4">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('student')} *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">person</span>
              <select name="student_id" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                <option value="">{tc('search')}</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeLabel')} *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">receipt</span>
              <input name="label" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required placeholder={t('feeLabelPlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('amount')} ({tc('currency')}) *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">payments</span>
                <input name="amount" type="number" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-lg font-black tabular-nums focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feePeriod')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">calendar_month</span>
                <select name="period_type" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                  <option value="monthly">{t('monthly')}</option>
                  <option value="semester">{t('semester')}</option>
                  <option value="annual">{t('annual')}</option>
                  <option value="one_time">{t('oneTime')}</option>
                </select>
                <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeClass')} ({tc('optional')})</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">school</span>
              <select name="class_id" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                <option value="">—</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={() => setShowFeeModal(false)} className="h-11 px-8 rounded-2xl text-sm font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all" disabled={isPending}>{tc('cancel')}</button>
            <button type="submit" className="h-11 px-10 bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3" disabled={isPending}>
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('addFee')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Class Fee Modal */}
      <Modal open={showBulkFeeModal} onClose={() => setShowBulkFeeModal(false)} title={t('bulkClassFee')} size="md">
        <form action={handleBulkFee} className="space-y-6 p-4">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs font-bold text-primary flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] mt-0.5">info</span>
            <p>{t('bulkFeeDesc')}</p>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeClass')} *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">school</span>
              <select name="class_id" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                <option value="">{t('selectClass')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feeLabel')} *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">receipt</span>
              <input name="label" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required placeholder={t('feeLabelPlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('amount')} ({tc('currency')}) *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">payments</span>
                <input name="amount" type="number" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-lg font-black tabular-nums focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('feePeriod')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">calendar_month</span>
                <select name="period_type" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer">
                  <option value="monthly">{t('monthly')}</option>
                  <option value="semester">{t('semester')}</option>
                  <option value="annual">{t('annual')}</option>
                  <option value="one_time">{t('oneTime')}</option>
                </select>
                <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={() => setShowBulkFeeModal(false)} className="h-11 px-8 rounded-2xl text-sm font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all" disabled={isPending}>{tc('cancel')}</button>
            <button type="submit" className="h-11 px-10 bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3" disabled={isPending}>
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('assignToClass')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Void Payment Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleVoidPayment}
        title={t('deleteRecord')}
        description={t('deleteRecordDesc')}
        loading={isPending}
      />

      {/* Delete Fee Confirm */}
      <ConfirmDialog
        open={!!deleteFeeTarget}
        onClose={() => setDeleteFeeTarget(null)}
        onConfirm={handleDeleteFee}
        title={t('deleteFeeTitle')}
        description={t('deleteFeeDesc')}
        loading={isPending}
      />
    </div>
  )
}
