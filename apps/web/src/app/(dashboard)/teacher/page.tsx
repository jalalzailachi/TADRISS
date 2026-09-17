import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard'
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard'


export const metadata: Metadata = {
  title: 'Teacher Portal | Tadriss',
  description: 'Teacher dashboard',
}
export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, requires_password_change, must_change_password')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/login')

  const requiresPasswordChange = profile.requires_password_change ?? profile.must_change_password ?? false

  if (requiresPasswordChange) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ForcePasswordChangeCard />
      </div>
    )
  }

  return <TeacherDashboard userId={user.id} />
}
