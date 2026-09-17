import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function StudentHomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, locale] = await Promise.all([
    getTranslations('studentPortal.homework'),
    getLocale(),
  ])

  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', user.id)

  const classIds = studentClasses?.map(sc => sc.class_id) || []

  type HomeworkRow = {
    id: string
    title: string
    description: string | null
    due_date: string | null
    class: { name: string } | null
  }
  let homework: HomeworkRow[] = []
  if (classIds.length > 0) {
    const { data } = await supabase
      .from('homework')
      .select('id, title, description, due_date, class:classes(name)')
      .in('class_id', classIds)
      .order('due_date', { ascending: true })
    homework = (data || []) as unknown as HomeworkRow[]
  }

  const columns = [
    {
      key: 'title',
      label: t('titleColumn'),
      render: (row: HomeworkRow) => (
        <div className="flex flex-col py-1">
          <span className="font-black text-on-surface uppercase italic tracking-tighter leading-none mb-1">{row.title}</span>
          {row.description && (
            <span className="text-[10px] text-outline font-medium opacity-60 truncate max-w-xs">{row.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'class',
      label: t('classColumn'),
      render: (row: HomeworkRow) => (
        <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface-variant uppercase tracking-widest border border-outline-variant/10">
          {row.class?.name}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: t('dueDateColumn'),
      render: (row: HomeworkRow) => {
        const isOverdue = row.due_date && new Date(row.due_date) < new Date()
        return (
          <span className={`text-xs font-black uppercase tracking-tight ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
            {row.due_date
              ? new Date(row.due_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-8 anim-in">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <DataTable
        data={homework}
        emptyMessage={t('emptyHomework')}
        columns={columns}
      />
    </div>
  )
}
