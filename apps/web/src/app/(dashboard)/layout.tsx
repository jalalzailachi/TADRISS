import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard'
import { cookies } from 'next/headers'
import { SupportWidget } from '@/components/ui/SupportWidget'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to bypass RLS — the anon client's RLS policies
  // have circular dependencies that can block profile reads
  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, first_name, last_name, role, requires_password_change, must_change_password, institution_id, institutions(name)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login?error=profile_not_found')
  }
  
  if (!['institution_admin', 'teacher', 'student', 'super_admin'].includes(profile.role)) {
    await supabase.auth.signOut()
    redirect('/login?error=unrecognized_role')
  }

  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'fr'
  const userName = `${profile.first_name} ${profile.last_name}`
  const institutionName = (profile.institutions as unknown as { name?: string } | null)?.name || 'Tadriss Platform'
  const requiresPasswordChange = profile.requires_password_change ?? profile.must_change_password ?? false

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <Sidebar role={profile.role} locale={locale} userName={userName} institutionName={institutionName} />
      <main 
        className="min-h-screen relative transition-all duration-300 pt-16 md:pt-0"
        style={{ marginInlineStart: 'var(--sidebar-width, 0px)' }}
      >
        <div className="pt-8 pb-24 md:pb-8 px-6 md:px-12">
          {requiresPasswordChange ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-2xl">
                <ForcePasswordChangeCard />
              </div>
            </div>
          ) : (
            <div className="anim-in">
              {children}
            </div>
          )}
        </div>
        <SupportWidget />
      </main>
    </div>
  )
}
