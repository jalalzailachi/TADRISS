'use client'

import { useTranslations, useLocale } from 'next-intl'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

export type AttendanceRecord = {
  status: string
  marked_at: string
  session: {
    session_date: string
    class: { name: string } | null
  } | null
}

export function StudentAttendanceClient({ attendance }: { attendance: AttendanceRecord[] }) {
  const t = useTranslations('studentPortal.attendance')
  const locale = useLocale()

  const columns = [
    {
      key: 'class',
      label: t('subject'),
      render: (row: AttendanceRecord) => (
        <div className="flex flex-col py-1">
          <span className="font-black text-on-surface uppercase italic tracking-tighter leading-none mb-1">
            {row.session?.class?.name}
          </span>
        </div>
      )
    },
    {
      key: 'marked_at',
      label: t('date'),
      render: (row: AttendanceRecord) => (
        <div className="flex items-center gap-3 text-on-surface">
          <span className="material-symbols-outlined text-[18px] text-outline">calendar_today</span>
          <span className="text-xs font-black uppercase italic tracking-tight">
            {new Date(row.marked_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('status'),
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} />
    },
  ]

  return (
    <div className="space-y-10 pb-12 anim-in">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <DataTable
        data={attendance}
        emptyMessage={t('emptyAttendance')}
        columns={columns}
      />
    </div>
  )
}
