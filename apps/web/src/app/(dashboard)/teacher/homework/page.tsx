import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function TeacherHomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, th, locale] = await Promise.all([
    getTranslations('homework'),
    getTranslations('teacherPortal.homework'),
    getLocale(),
  ])

  type TeacherHomeworkRow = {
    id: string
    title: string
    due_date: string | null
    class: { name: string } | null
  }
  const { data: homeworkData } = await supabase
    .from('homework')
    .select('id, title, due_date, class:classes(name)')
    .eq('teacher_id', user.id)
    .order('due_date', { ascending: false })
  const homework = (homeworkData || []) as unknown as TeacherHomeworkRow[]

  const columns = [
    {
      key: 'title',
      label: t('title'),
      render: (row: TeacherHomeworkRow) => (
        <span className="font-black text-on-surface uppercase italic tracking-tighter">{row.title}</span>
      ),
    },
    {
      key: 'class',
      label: t('dueDate').replace('Date', '') || 'Class',
      render: (row: TeacherHomeworkRow) => (
        <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-widest border border-outline-variant/10">
          {row.class?.name}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: t('dueDate'),
      render: (row: TeacherHomeworkRow) => {
        const isOverdue = row.due_date && new Date(row.due_date) < new Date()
        return (
          <span className={`text-xs font-black uppercase tracking-tight ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
            {row.due_date
              ? new Date(row.due_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
              : t('noLimit')}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-8 anim-in">
      <PageHeader title={th('title')} subtitle={th('subtitle')} />
      <DataTable
        data={homework || []}
        emptyMessage={th('emptyHomework')}
        columns={columns}
      />
    </div>
  )
}
