'use client'

import { useTranslations, useLocale } from 'next-intl'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

export type Payment = {
  id: string
  amount: number
  status: string
  notes: string | null
  payment_date: string
}

export function StudentPaymentsClient({
  payments,
  outstandingFeesCount,
}: {
  payments: Payment[]
  outstandingFeesCount: number
}) {
  const t = useTranslations('studentPortal.payments')
  const tc = useTranslations('common')
  const locale = useLocale()

  const columns = [
    {
      key: 'amount',
      label: t('amount'),
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-on-surface tabular-nums">{row.amount}</span>
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60 italic">{tc('currency')}</span>
        </div>
      )
    },
    {
      key: 'payment_date',
      label: t('date'),
      render: (row: Payment) => (
        <div className="flex items-center gap-3 text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-outline opacity-40">calendar_today</span>
          <span className="text-xs font-black uppercase italic tracking-tight">
            {new Date(row.payment_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('status'),
      render: (row: Payment) => <StatusBadge status={row.status} />
    },
  ]

  return (
    <div className="space-y-10 pb-12 anim-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-outline-variant/10">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        {outstandingFeesCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-warning-soft border border-on-warning-soft/10 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-on-warning-soft text-[20px]">warning</span>
            <span className="text-[10px] font-black tracking-widest uppercase text-on-warning-soft">
              {t('actionsRequired', { count: outstandingFeesCount })}
            </span>
          </div>
        )}
      </div>
      <DataTable
        data={payments}
        emptyMessage={t('emptyPayments')}
        columns={columns}
      />
    </div>
  )
}
