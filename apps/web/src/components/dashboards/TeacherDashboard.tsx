'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/ui/StatsCard';
import { TakeAttendanceModal } from '@/components/ui/TakeAttendanceModal';

export function TeacherDashboard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ classes: 0, students: 0 });
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // CORRECT — let RLS handle filtering
      const { data: classesData } = await supabase.from('classes').select('id, name');
      
      const mappedClasses = classesData || [];
      setClasses(mappedClasses);
      setStats({ classes: mappedClasses.length, students: 0 });
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teacher Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your classes, log attendance, and coordinate assignments.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard label="My Classes" value={stats.classes} icon="class" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard label="Total Students" value={stats.students} icon="groups" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-slate-200 shadow-sm rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-blue-600 text-3xl">fact_check</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Class Attendance</h3>
            <p className="text-sm text-slate-500 mb-8 text-center max-w-xs leading-relaxed">
              Mark attendance for today's sessions instantly via the rapid bulk tracker.
            </p>
            <button 
              onClick={() => setAttendanceModalOpen(true)} 
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-2"
            >
              Take Attendance
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-slate-300 text-4xl mb-3">school</span>
          <p className="text-slate-500 text-sm font-medium">Your active schedule will sync here natively.</p>
        </div>
      </div>

      <TakeAttendanceModal 
        open={attendanceModalOpen} 
        onClose={() => setAttendanceModalOpen(false)} 
        onSuccess={() => {
          setAttendanceModalOpen(false);
        }} 
        classes={classes} 
        userId={userId} 
      />
    </div>
  );
}
