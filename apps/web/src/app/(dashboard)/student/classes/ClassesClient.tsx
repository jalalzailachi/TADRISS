'use client'

import { useTranslations } from 'next-intl'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'

export type StudentClass = {
  id: string
  name: string
  subject: string | null
  level: string | null
}

export function StudentClassesClient({ classes }: { classes: StudentClass[] }) {
  const t = useTranslations('studentPortal.classes')

  const columns = [
    {
      key: 'name',
      label: t('classDescriptor'),
      render: (row: StudentClass) => (
        <div className="flex flex-col py-1">
          <span className="font-black text-on-surface uppercase italic tracking-tighter leading-none mb-1">{row.name}</span>
        </div>
      )
    },
    {
      key: 'subject',
      label: t('coreSubject'),
      render: (row: StudentClass) => (
        <span className="text-xs font-black text-on-surface uppercase italic tracking-tight opacity-80">
          {row.subject || t('generalEducation')}
        </span>
      )
    },
    {
      key: 'level',
      label: t('academicLevel'),
      render: (row: StudentClass) => (
        <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-widest border border-outline-variant/10 shadow-xs">
          {row.level || t('standard')}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-10 pb-12 anim-in">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <DataTable
        data={classes}
        emptyMessage={t('emptyClasses')}
        columns={columns}
      />
    </div>
  )
}
