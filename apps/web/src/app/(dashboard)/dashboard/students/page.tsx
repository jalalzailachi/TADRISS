import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { StudentsClient, type Student } from './StudentsClient'


export const metadata: Metadata = {
  title: 'Students | Tadriss',
  description: 'Manage enrolled students',
}
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q: query, page } = await searchParams
  const currentPage = Number(page) || 1
  const pageSize = 12
  const offset = (currentPage - 1) * pageSize

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

  let dbQuery = admin
    .from('profiles')
    .select(`
      id, first_name, last_name, email, phone, created_at,
      class_students(
        class:classes(id, name)
      )
    `, { count: 'exact' })
    .eq('role', 'student')
    .eq('institution_id', profile.institution_id)
    .is('deleted_at', null)

  if (query) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
  }

  const { data: students, count, error } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) console.error('[StudentsPage]', error)

  return (
    <div>
      <StudentsClient
        initialStudents={(students || []) as unknown as Student[]}
        totalCount={count || 0}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  )
}
