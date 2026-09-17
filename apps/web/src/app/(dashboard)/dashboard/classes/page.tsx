import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ClassesClient, type Class } from './ClassesClient'


export const metadata: Metadata = {
  title: 'Classes | Tadriss',
  description: 'Manage classes',
}
export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'institution_admin') redirect('/login')

  const { data: classes, error } = await admin
    .from('classes')
    .select(`
      id, name, subject, schedule, capacity, created_at,
      class_students(count),
      class_teachers(
        profiles(id, first_name, last_name)
      )
    `)
    .eq('institution_id', profile.institution_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) console.error('[ClassesPage]', error)

  // Map first_name/last_name to full_name for the client
  const mappedClasses = (classes || []).map(cls => ({
    ...cls,
    class_teachers: (cls.class_teachers || []).map(ct => {
        const p = Array.isArray(ct.profiles) ? ct.profiles[0] : ct.profiles
        return {
          profiles: p ? {
            id: p.id,
            full_name: `${p.first_name} ${p.last_name}`.trim()
          } : null
        }
    })
  }))

  return (
    <div>
      <ClassesClient classes={mappedClasses as unknown as Class[]} />
    </div>
  )
}
