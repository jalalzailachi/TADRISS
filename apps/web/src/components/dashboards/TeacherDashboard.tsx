// components/dashboards/TeacherDashboard.tsx
'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { TakeAttendanceModal } from '@/components/ui/TakeAttendanceModal';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import Link from 'next/link';

interface TeacherClass {
  id: string;
  name: string;
  subject: string;
  student_count: number;
  schedule?: string;
}

interface AttendanceSession {
  id: string;
  session_date: string;
  class: { name: string };
  records: { count: number }[];
}

export function TeacherDashboard({ userId }: { userId: string }) {
  const t = useTranslations('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ classes: 0, students: 0 });
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Fetch only classes this teacher is assigned to (security: no cross-institution data)
      const [assignedRes, sessionsRes] = await Promise.all([
        supabase
          .from('class_teachers')
          .select('class:classes(id, name, subject, schedule, students:class_students(count))')
          .eq('teacher_id', userId),
        supabase
          .from('attendance_sessions')
          .select('id, session_date, class:classes(name), records:attendance_records(count)')
          .eq('teacher_id', userId)
          .order('session_date', { ascending: false })
          .limit(5),
      ]);

      type AssignedRow = {
        class: {
          id: string
          name: string
          subject: string | null
          schedule: string | null
          students: { count: number }[]
        }
      }
      const mappedClasses = ((assignedRes.data || []) as unknown as AssignedRow[]).map((row) => {
        const c = row.class
        return {
          id: c.id,
          name: c.name,
          subject: c.subject ?? '',
          schedule: c.schedule ?? undefined,
          student_count: c.students?.[0]?.count ?? 0,
        }
      });
      
      setClasses(mappedClasses);
      setSessions((sessionsRes.data || []) as unknown as AttendanceSession[]);
      
      const totalStudents = mappedClasses.reduce((acc, curr) => acc + curr.student_count, 0);
      setStats({ classes: mappedClasses.length, students: totalStudents });
      setLoading(false);
    }
    load().catch((err) => {
      console.error('[TeacherDashboard] load error:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    });
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center h-64 items-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex justify-center h-64 items-center">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
        <p className="text-sm font-bold text-outline">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <RealtimeRefresh table="attendance_sessions" />

      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-outline-variant/10">
        <div>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-outline mb-3">
              <span className="text-primary italic">{t('facultyAccess')}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
              <span className="text-on-surface">{t('educatorTerminal')}</span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-on-surface uppercase italic mb-2 leading-tight">
            {t('academicOutlook')}
          </h2>
          <p className="text-sm font-bold text-outline uppercase tracking-[0.2em]">
            {t('managingModules', { classes: stats.classes, students: stats.students })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setAttendanceModalOpen(true)} className="h-12 px-5 sm:px-8 bg-on-surface text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">fact_check</span>
            <span className="hidden sm:inline">{t('recordAttendance')}</span>
          </button>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-on-surface p-6 sm:p-8 h-[180px] sm:h-[220px] rounded-3xl sm:rounded-[40px] text-white relative overflow-hidden flex flex-col justify-end group border border-on-surface shadow-2xl shadow-on-surface/20">
             <div className="absolute top-0 end-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-primary/30 transition-colors"></div>
             <div className="relative z-10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('totalModules')}</p>
                <div className="flex items-end gap-3">
                   <p className="text-6xl font-black text-white tracking-tighter tabular-nums leading-none">{stats.classes}</p>
                   <span className="text-xs font-black text-primary uppercase tracking-widest mb-1 italic">{t('active')}</span>
                </div>
             </div>
        </div>

        <div className="bg-surface-container-lowest p-6 sm:p-8 h-[180px] sm:h-[220px] rounded-3xl sm:rounded-[40px] border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col justify-end group hover:border-secondary/30 transition-all">
          <div className="absolute top-6 end-8 w-14 h-14 rounded-2xl bg-warning-soft text-on-warning-soft flex items-center justify-center border border-on-warning-soft/10 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-3xl">diversity_3</span>
          </div>
          <div className="relative z-10">
             <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('studentBase')}</p>
             <p className="text-6xl font-black text-on-surface tracking-tighter tabular-nums leading-none">{stats.students}</p>
          </div>
        </div>

        <button onClick={() => setAttendanceModalOpen(true)} className="bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-3xl sm:rounded-[40px] flex flex-col items-center justify-center text-center p-6 sm:p-8 group hover:bg-surface-container-high hover:border-primary/30 transition-all cursor-pointer min-h-[140px] w-full">
            <div className="w-16 h-16 rounded-3xl bg-surface-container-high flex items-center justify-center mb-4 shadow-inner">
               <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl">add_task</span>
            </div>
            <p className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">{t('scheduleNewSession')}</p>
        </button>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        
        {/* LEFT: Today's Timeline */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{t('myClasses')}</h3>
             <Link href="/teacher/classes" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">{t('viewAll')}</Link>
          </div>

          <div className="relative ps-8 space-y-8 before:absolute before:inset-y-0 before:start-[11px] before:w-[2px] before:bg-outline-variant/20">
            {classes.length === 0 ? (
               <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30">
                  <p className="text-sm font-bold text-outline uppercase tracking-widest">{t('noClasses')}</p>
               </div>
            ) : classes.map((cls) => (
                <div key={cls.id} className="relative group">
                  <div className="absolute -start-[29px] top-1.5 w-4 h-4 rounded-full border-4 border-background bg-outline-variant group-hover:bg-primary transition-all"></div>
                  <div className="p-6 rounded-2xl border bg-surface-container-low/50 border-transparent hover:bg-surface-container-lowest hover:border-outline-variant/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      {cls.schedule && (
                        <span className="text-[10px] font-bold font-mono text-outline uppercase tracking-widest">{cls.schedule}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-highest text-outline">
                        {cls.subject}
                      </span>
                    </div>
                    <h4 className="text-lg font-extrabold text-on-surface mb-4">{cls.name}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-outline">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {cls.student_count} {t('students')}
                      </div>
                      <button onClick={() => setAttendanceModalOpen(true)} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-focus transition-all opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('recordAttendance')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT: Sidebar Monitoring */}
        <div className="space-y-8">
          {/* Class Overview */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-8">{t('classOverview')}</h3>
            <div className="space-y-6">
              {classes.slice(0, 4).map((cls) => {
                const maxStudents = Math.max(...classes.map(c => c.student_count), 1);
                const pct = Math.round((cls.student_count / maxStudents) * 100);
                return (
                  <div key={cls.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-on-surface truncate pe-4">{cls.name}</span>
                      <span className="text-[10px] font-extrabold font-mono text-primary">{cls.student_count} {t('students')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-8">{t('recentAttendance')}</h3>
            
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/50">
                <span className="material-symbols-outlined text-outline mb-2">history</span>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('noRecentSessions')}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div key={session.id} className="group relative flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-surface-container-low border border-transparent hover:border-outline-variant/40">
                    <div className="w-10 h-10 rounded-xl bg-success-soft text-on-success-soft flex items-center justify-center border border-on-success-soft/10 shrink-0 capitalize font-bold text-xs">
                      {new Date(session.session_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-on-surface truncate leading-none mb-1">{session.class?.name}</p>
                        <p className="text-[10px] font-bold text-on-success-soft uppercase tracking-wider">
                          +{session.records?.[0]?.count || 0} {t('presences')}
                        </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Notice Card — only show if no session recorded today */}
          {classes.length > 0 && !sessions.some(s => s.session_date === new Date().toISOString().split('T')[0]) && (
          <div className="bg-warning-soft border border-on-warning-soft/10 p-8 rounded-3xl relative overflow-hidden group">
             <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-on-warning-soft/10 rounded-full">
                   <span className="material-symbols-outlined text-sm text-on-warning-soft">priority_high</span>
                   <span className="text-[10px] font-bold text-on-warning-soft uppercase tracking-widest">{t('missingRecords')}</span>
                </div>
                <h4 className="text-lg font-extrabold text-on-surface tracking-tight leading-tight">
                   {t('noAttendanceToday')}
                </h4>
                <button onClick={() => setAttendanceModalOpen(true)} className="inline-block text-xs font-bold text-on-warning-soft hover:underline uppercase tracking-widest">
                   {t('recordAttendance')}
                </button>
             </div>
             <div className="absolute top-0 end-0 w-32 h-32 bg-on-warning-soft/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 transition-opacity"></div>
          </div>
          )}
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
