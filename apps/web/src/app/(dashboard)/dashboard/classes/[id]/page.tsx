import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClassDetailClient } from './ClassDetailClient'

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Fetch Class with details — no select('*') in production
  const { data: cls, error: clsError } = await admin
    .from('classes')
    .select('id, name, subject, schedule, capacity, level, is_active, institution_id, created_at')
    .eq('id', id)
    .eq('institution_id', profile.institution_id)
    .is('deleted_at', null)
    .single()

  if (clsError || !cls) return notFound()

  // Fetch Members using admin client for reliable data access
  const [studentsRes, teachersRes, allStudentsRes, allTeachersRes, homeworkRes] = await Promise.all([
    admin.from('class_students').select('profiles(id, first_name, last_name, email)').eq('class_id', id),
    admin.from('class_teachers').select('profiles(id, first_name, last_name, email)').eq('class_id', id),
    admin.from('profiles').select('id, first_name, last_name, email').eq('institution_id', profile.institution_id).eq('role', 'student').is('deleted_at', null),
    admin.from('profiles').select('id, first_name, last_name, email').eq('institution_id', profile.institution_id).eq('role', 'teacher').is('deleted_at', null),
    admin.from('homework').select('id, title, description, due_date, created_at').eq('class_id', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(20)
  ])

  type ProfileMember = { id: string; first_name: string; last_name: string; email: string }
  type ProfileRef = { profiles: ProfileMember | null }
  const students = ((studentsRes.data ?? []) as unknown as ProfileRef[]).map((s) => s.profiles).filter((p): p is ProfileMember => p !== null)
  const teachers = ((teachersRes.data ?? []) as unknown as ProfileRef[]).map((t) => t.profiles).filter((p): p is ProfileMember => p !== null)
  const allStudents = allStudentsRes.data ?? []
  const allTeachers = allTeachersRes.data ?? []
  const homework = homeworkRes.data ?? []

  return (
    <ClassDetailClient 
      cls={cls}
      students={students}
      teachers={teachers}
      allStudents={allStudents}
      allTeachers={allTeachers}
      homework={homework}
      userRole={profile.role}
    />
  )
}
