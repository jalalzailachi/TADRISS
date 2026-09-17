import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { TeachersClient, type Teacher } from './TeachersClient'


export const metadata: Metadata = {
  title: 'Teachers | Tadriss',
  description: 'Manage teaching staff',
}
export default async function TeachersPage() {
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

  const { data: teachers, error } = await admin
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, created_at,
      class_teachers(
        class:classes(id, name)
      )
    `)
    .eq('role', 'teacher')
    .eq('institution_id', profile.institution_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) console.error('[TeachersPage]', error)

  return (
    <div>
      <TeachersClient teachers={(teachers || []) as unknown as Teacher[]} />
    </div>
  )
}
