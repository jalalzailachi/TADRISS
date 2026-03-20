import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard'
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, requires_password_change, must_change_password')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/login')

  const requiresPasswordChange = profile.requires_password_change ?? profile.must_change_password ?? false

  return (
    <div className="space-y-6">
      {requiresPasswordChange && <ForcePasswordChangeCard />}
      <TeacherDashboard userId={user.id} />
    </div>
  )
}
