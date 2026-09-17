import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { StudentDashboard } from '@/components/dashboards/StudentDashboard'
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard'


export const metadata: Metadata = {
  title: 'Student Portal | Tadriss',
  description: 'Student dashboard',
}
export default async function StudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, requires_password_change, must_change_password')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/login')

  if (profile?.requires_password_change || profile?.must_change_password) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ForcePasswordChangeCard />
      </div>
    )
  }

  return <StudentDashboard userId={user.id} />
}
