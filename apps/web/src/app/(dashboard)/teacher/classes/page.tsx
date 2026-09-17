import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tc, tclass] = await Promise.all([
    getTranslations('teacherPortal.classes'),
    getTranslations('classes'),
  ])

  const { data: assignedClasses } = await supabase
    .from('class_teachers')
    .select('class:classes(id, name, subject, level, is_active, students:class_students(count))')
    .eq('teacher_id', user.id)
    .eq('is_active', true)

  type TeacherClassRow = {
    id: string
    name: string
    subject: string | null
    level: string | null
    is_active: boolean
    students: { count: number }[]
  }
  const classes = ((assignedClasses ?? []) as unknown as { class: TeacherClassRow }[]).map((c) => c.class)

  const columns = [
    {
      key: 'name',
      label: tclass('name'),
      render: (row: TeacherClassRow) => (
        <span className="font-black text-on-surface uppercase italic tracking-tighter">{row.name}</span>
      ),
    },
    { key: 'subject', label: tclass('subject'), render: (row: TeacherClassRow) => row.subject || tclass('noSubject') },
    { key: 'level', label: tclass('capacity'), render: (row: TeacherClassRow) => row.level || '—' },
    {
      key: 'students',
      label: tclass('members'),
      render: (row: TeacherClassRow) => (
        <span className="font-black text-primary tabular-nums">{row.students?.[0]?.count || 0}</span>
      ),
    },
    {
      key: 'is_active',
      label: tclass('action'),
      render: (row: TeacherClassRow) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
  ]

  return (
    <div className="space-y-8 anim-in">
      <PageHeader title={tc('title')} subtitle={tc('subtitle')} />
      <DataTable
        data={classes}
        emptyMessage={tc('emptyClasses')}
        columns={columns}
      />
    </div>
  )
}
