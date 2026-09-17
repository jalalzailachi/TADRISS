import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation'
import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Header } from '@/components/Header';


export const metadata: Metadata = {
  title: 'Dashboard | Tadriss',
  description: 'Admin dashboard overview',
}
export default async function DashboardRouter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'institution_admin') {
    redirect('/login');
  }

  // Fetch Stats and Activities in parallel using admin client
  const [statsRes, paymentsRes, attendanceRes, teachersCount, classesCount] = await Promise.all([
    admin.rpc('get_institution_stats', { p_institution_id: profile.institution_id }),
    admin.from('payments')
      .select('id, amount, status, created_at, student:profiles!payments_student_id_fkey(first_name, last_name)')
      .eq('institution_id', profile.institution_id)
      .order('created_at', { ascending: false }).limit(6),
    admin.from('attendance_sessions')
      .select('id, session_date, created_at, class:classes(name), records:attendance_records(count)')
      .eq('institution_id', profile.institution_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(6),
    admin.from('profiles').select('id', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('role', 'teacher')
      .is('deleted_at', null),
    admin.from('classes').select('id', { count: 'exact', head: true })
      .eq('institution_id', profile.institution_id)
      .eq('is_active', true)
      .is('deleted_at', null),
  ]);

  const stats = {
    total_students: statsRes.data?.active_students || 0,
    total_teachers: teachersCount.count || 0,
    total_classes: classesCount.count || 0,
    monthly_revenue: statsRes.data?.monthly_revenue || 0,
    pending_payments: 0, // Simplified or could be added to RPC
  };

  type Activity = {
    id: string
    type: 'payment' | 'attendance'
    date: Date
    title: string
    desc: string
    icon: string
    color: string
  }
  type PaymentRow = {
    id: string
    created_at: string
    amount: number
    student: { first_name: string; last_name: string } | null
  }
  type AttendanceRow = {
    id: string
    created_at: string | null
    session_date: string
    class: { name: string } | null
    records: { count: number }[]
  }

  const activities: Activity[] = [
    ...((paymentsRes.data || []) as unknown as PaymentRow[]).map((p) => ({
      id: `p-${p.id}`,
      type: 'payment' as const,
      date: new Date(p.created_at),
      title: "payment_recorded",
      desc: `${p.student?.first_name} ${p.student?.last_name} · ${p.amount} MAD`,
      icon: 'payments',
      color: 'text-tertiary shadow-tertiary/20 bg-tertiary/5'
    })),
    ...((attendanceRes.data || []) as unknown as AttendanceRow[]).map((a) => ({
      id: `a-${a.id}`,
      type: 'attendance' as const,
      date: new Date(a.created_at || a.session_date),
      title: "attendance_completed",
      desc: `${a.class?.name} · ${a.records?.[0]?.count || 0} students`,
      icon: 'event_available',
      color: 'text-primary shadow-primary/20 bg-primary/5'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="flex flex-col min-h-full page-enter">
      <Header />
      <div className="flex-1 mt-6">
        <AdminDashboard 
          userId={user.id} 
          initialStats={stats} 
          initialActivities={activities}
          initialUserName={profile.first_name || 'Admin'}
        />
      </div>
    </div>
  );
}
