import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { HomeworkClient, type Homework, type Class } from './HomeworkClient'


export const metadata: Metadata = {
  title: 'Homework | Tadriss',
  description: 'Manage homework assignments',
}
export default async function HomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['institution_admin', 'teacher'].includes(profile.role)) redirect('/login')

  // Fetch homework and classes in parallel using admin client
  const [homeworkRes, classesRes] = await Promise.all([
    admin
      .from('homework')
      .select(`
        id, title, description, due_date, created_at,
        class:classes(id, name)
      `)
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null)
      .order('due_date', { ascending: true }),
    admin
      .from('classes')
      .select('id, name')
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null),
  ])

  if (homeworkRes.error) console.error('[HomeworkPage]', homeworkRes.error)

  const homework = homeworkRes.data
  const classes = classesRes.data

  return (
    <div>
      <HomeworkClient
        homework={(homework || []) as unknown as Homework[]}
        classes={(classes || []) as unknown as Class[]}
      />
    </div>
  )
}
