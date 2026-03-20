import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard'
import { Badge } from '@/components/ui/Badge'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile, classes, attendance, and payments in parallel
  const [profileRes, attendanceRes, paymentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, class_students(class:classes(*))')
      .eq('id', user.id)
      .single(),
    supabase
      .from('attendance_records')
      .select('status, marked_at, attendance_sessions(session_date)')
      .eq('student_id', user.id)
      .order('marked_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('student_id', user.id)
      .order('payment_date', { ascending: false })
      .limit(5)
  ])

  const profile = profileRes.data
  if (profile?.role !== 'student') redirect('/login')

  const attendance = attendanceRes.data || []
  const payments = paymentsRes.data || []

  // Calculate attendance stats
  const totalSessions = attendance.length
  const presentCount = attendance.filter(r => r.status === 'present').length
  const lateCount = attendance.filter(r => r.status === 'late').length
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0

  // Check if password change is required
  const requiresPasswordChange = profile.requires_password_change ?? profile.must_change_password ?? false

  return (
    <div className="space-y-6">
      {requiresPasswordChange && <ForcePasswordChangeCard />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord Étudiant</h1>
          <p className="text-sm text-slate-500 mt-1">Heureux de vous revoir, {profile.first_name} !</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de présence</p>
          <p className={`text-2xl font-black ${attendanceRate >= 80 ? 'text-emerald-500' : attendanceRate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {attendanceRate}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Classes Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">class</span>
            Mes Classes
          </h2>
          <div className="space-y-3 flex-1">
            {profile.class_students?.length > 0 ? (
              profile.class_students.map((cs: any) => (
                <div key={cs.class.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{cs.class.name}</p>
                    <p className="text-xs text-slate-500">Année scolaire 2023/24</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-slate-400">group_off</span>
                </div>
                <p className="text-sm text-slate-500 px-4">Vous n'êtes inscrit dans aucune classe pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">calendar_today</span>
            Présence Récente
          </h2>
          <div className="space-y-3 flex-1">
            {attendance.length > 0 ? (
              attendance.slice(0, 5).map((record: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date((record.attendance_sessions as any).session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-slate-500 italic">Session de cours</p>
                  </div>
                  <Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                    {record.status === 'present' ? 'Présent' : record.status === 'late' ? 'En retard' : 'Absent'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-400 italic">
                <p className="text-sm">Aucune donnée de présence pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payments History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">payments</span>
            Derniers Paiements
          </h2>
          <div className="space-y-3 flex-1">
            {payments.length > 0 ? (
              payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.amount} {p.currency || 'DH'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant={p.status === 'recorded' ? 'success' : 'warning'}>
                    {p.status === 'recorded' ? 'Payé' : p.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-400 italic">
                <p className="text-sm">Aucun historique de paiement disponible.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
