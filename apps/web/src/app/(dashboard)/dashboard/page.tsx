import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';

export default async function DashboardRouter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Error loading your authentication role bounds.</p>
      </div>
    );
  }

  const role = profile.role;

  if (role === 'institution_admin') return <AdminDashboard userId={user.id} />;
  if (role === 'teacher') return <TeacherDashboard userId={user.id} />;
  if (role === 'student') return <StudentDashboard userId={user.id} />;

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <span className="material-symbols-outlined text-4xl text-amber-500">warning</span>
      <p className="text-slate-500 text-sm">Unrecognized dashboard role configuration: {role}</p>
    </div>
  );
}
