'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/ui/StatsCard';

export function StudentDashboard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ classes: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { count: classesCount } = await supabase.from('class_students').select('*', { count: 'exact', head: true }).eq('student_id', userId);
      setStats({ classes: classesCount || 0 });
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Check your personal schedule, attendance tracking, and pending assignments.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard label="Enrolled Classes" value={stats.classes} icon="class" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard label="Attendance Rate" value="---" icon="event_available" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center h-48">
        <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">history</span>
        <p className="text-slate-500 text-sm">Your recent attendance logs will appear here.</p>
      </div>
    </div>
  );
}
