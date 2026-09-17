// components/dashboards/StudentDashboard.tsx
'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import { getStudentDashboardData } from '@/app/actions/user';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { OutstandingFeesBanner } from '@/components/OutstandingFeesBanner';
import Link from 'next/link';

interface StudentSummary {
  classes: number;
  attendance: number;
}

interface StudentClass {
  id: string;
  name: string;
  student_count?: number;
  teacher_count?: number;
}

interface AttendanceRecord {
  status: 'present' | 'absent' | 'late';
  marked_at: string;
  session: { session_date: string; class: { name: string } };
}

interface HomeworkItem {
  id: string;
  title: string;
  due_date: string;
  class: { name: string };
}

interface StudentPayment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
}

export function StudentDashboard({ userId }: { userId: string }) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentSummary>({ classes: 0, attendance: 0 });
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [outstandingFees, setOutstandingFees] = useState<{ id: string; amount: number; description: string; due_date: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // First fetch dashboard data (needed for class IDs to scope homework query)
      const dashboardRes = await getStudentDashboardData(userId)
      const enrolledClassIds = ((dashboardRes.classes as StudentClass[]) || []).map((c) => c.id)

      const [attendanceRes, homeworkRes, paymentsRes, feesRes] = await Promise.all([
        supabase
          .from('attendance_records')
          .select('status, marked_at, session:attendance_sessions(session_date, class:classes(name))')
          .eq('student_id', userId)
          .order('marked_at', { ascending: false })
          .limit(5),
        // Only fetch homework for classes this student is enrolled in
        enrolledClassIds.length > 0
          ? supabase
              .from('homework')
              .select('id, title, description, due_date, class:classes(name)')
              .in('class_id', enrolledClassIds)
              .order('due_date', { ascending: true })
              .limit(5)
          : Promise.resolve({ data: [] }),
        supabase
          .from('payments')
          .select('id, amount, status, notes, payment_date')
          .eq('student_id', userId)
          .order('payment_date', { ascending: false })
          .limit(5),
        supabase
          .from('enrollment_fees')
          .select('id, amount, description, due_date')
          .eq('student_id', userId)
          .eq('is_active', true)
          .order('due_date', { ascending: true }),
      ]);

      // Always update classes from dashboardRes (fetched before the parallel block)
      const mappedClasses = (dashboardRes.classes || []) as StudentClass[];
      setClasses(mappedClasses);
      setStats(prev => ({ ...prev, classes: mappedClasses.length }));

      setAttendance((attendanceRes.data || []) as unknown as AttendanceRecord[]);
      setHomework((homeworkRes.data || []) as unknown as HomeworkItem[]);
      setPayments((paymentsRes.data || []) as unknown as StudentPayment[]);
      setOutstandingFees(feesRes.data || []);

      if (attendanceRes.data && attendanceRes.data.length > 0) {
        const present = attendanceRes.data.filter(r => r.status === 'present' || r.status === 'late').length;
        setStats(prev => ({ ...prev, attendance: Math.round((present / attendanceRes.data!.length) * 100) }));
      }

      setLoading(false);
    }
    load().catch((err) => {
      console.error('[StudentDashboard] load error:', err);
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
      <RealtimeRefresh table="attendance_records" filter={`student_id=eq.${userId}`} />
      <RealtimeRefresh table="homework" />
      <RealtimeRefresh table="payments" filter={`student_id=eq.${userId}`} />

      {outstandingFees.length > 0 && <OutstandingFeesBanner fees={outstandingFees} />}

      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-outline-variant/10">
        <div>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-outline mb-3">
              <span className="text-primary italic">{t('studentAccess')}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
              <span className="text-on-surface">{t('scholarTerminal')}</span>
           </div>
           <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-on-surface uppercase italic mb-2 leading-tight">
            {t('learningProgress')}
          </h2>
          <p className="text-sm font-bold text-outline uppercase tracking-[0.2em]">
            {t('enrolledModules', { classes: stats.classes, attendance: stats.attendance })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/student/homework" className="h-12 px-5 sm:px-8 bg-on-surface text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">assignment</span>
            <span className="hidden sm:inline">{t('studyTasks')}</span>
          </Link>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <div className="bg-surface-container-lowest p-5 sm:p-8 h-[160px] sm:h-[220px] rounded-2xl sm:rounded-[40px] border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col justify-end group hover:border-primary/30 transition-all">
          <div className="absolute top-4 end-4 sm:top-6 sm:end-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-info-soft text-on-info-soft flex items-center justify-center border border-on-info-soft/10 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-2xl sm:text-3xl">school</span>
          </div>
          <div className="relative z-10">
             <p className="text-[9px] sm:text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('activeModules')}</p>
             <p className="text-4xl sm:text-6xl font-black text-on-surface tracking-tighter tabular-nums leading-none">{stats.classes}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 sm:p-8 h-[160px] sm:h-[220px] rounded-2xl sm:rounded-[40px] border border-outline-variant/10 shadow-sm relative overflow-hidden flex flex-col justify-end group hover:border-tertiary/30 transition-all">
          <div className="absolute top-4 end-4 sm:top-6 sm:end-8 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-success-soft text-on-success-soft flex items-center justify-center border border-on-success-soft/10 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-2xl sm:text-3xl">event_available</span>
          </div>
          <div className="relative z-10">
             <p className="text-[9px] sm:text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('attendanceRating')}</p>
             <div className="flex items-end gap-2">
                <p className="text-4xl sm:text-6xl font-black text-on-surface tracking-tighter tabular-nums leading-none">{stats.attendance}</p>
                <span className="text-2xl sm:text-3xl font-black text-outline/30 mb-1">%</span>
             </div>
          </div>
        </div>

        <div className="col-span-2 bg-on-surface p-6 sm:p-10 rounded-2xl sm:rounded-[48px] relative overflow-hidden flex flex-col justify-end group border border-on-surface shadow-2xl shadow-on-surface/20">
             <div className="absolute top-0 end-0 w-[400px] h-[400px] bg-primary/20 blur-[150px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-primary/30 transition-colors"></div>
             <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                   <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t('academicStatus')}</span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter leading-tight uppercase italic max-w-sm">
                   {t.rich('motivationalMessage', { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
                </h3>
             </div>
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        
        {/* LEFT: School Life */}
        <div className="space-y-8">
          {/* My Classes — Horizontal Scroll */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold tracking-tight text-on-surface">{t('myClasses')}</h3>
                <Link href="/student/classes" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">{t('viewAll')}</Link>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
               {classes.map((cls) => (
                 <div key={cls.id} className="min-w-[220px] bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm group hover:translate-y-[-2px] hover:border-primary/30 transition-all shrink-0">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-outline group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                       </div>
                       <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{t('active')}</span>
                    </div>
                    <h4 className="text-md font-extrabold text-on-surface leading-tight group-hover:text-primary transition-colors h-10 line-clamp-2">{cls.name}</h4>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/10 font-mono text-[10px] text-outline font-bold">
                      <span className="material-symbols-outlined text-sm">group</span>
                      {cls.student_count ?? 0} {t('students')}
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Homework & Attendance Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Grouped Homework */}
             <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-6">{t('homeworkStatus')}</h3>
                {homework.length === 0 ? (
                  <p className="text-xs font-medium text-outline italic">{t('noPendingTasks')}</p>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const now = new Date();
                      const overdue = homework.filter(h => new Date(h.due_date) < now);
                      const upcoming = homework.filter(h => new Date(h.due_date) >= now);
                      return (
                        <>
                          {overdue.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-[9px] font-bold text-error uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-error"></span> {t('overdue')}
                              </p>
                              {overdue.map(item => (
                                <div key={item.id} className="bg-error-soft p-3 rounded-xl border border-on-error-soft/10">
                                  <p className="text-sm font-extrabold text-on-surface mb-1">{item.title}</p>
                                  <p className="text-[10px] font-bold text-error/70 uppercase">{item.class?.name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {upcoming.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-[9px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-outline"></span> {t('upcoming')}
                              </p>
                              {upcoming.map(item => (
                                <div key={item.id} className="flex flex-col gap-1 pb-3 border-b border-outline-variant/10 last:border-0 last:pb-0">
                                  <p className="text-sm font-extrabold text-on-surface">{item.title}</p>
                                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-outline">
                                    <span>{item.class?.name}</span>
                                    <span className="text-primary">{new Date(item.due_date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
             </div>

             {/* Attendance History */}
             <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-6">{t('recentPresence')}</h3>
                {attendance.length === 0 ? (
                  <p className="text-xs font-medium text-outline italic">{t('noHistoryAvailable')}</p>
                ) : (
                  <div className="space-y-4">
                    {attendance.map((record, i) => (
                      <div key={i} className="flex items-center justify-between pb-3 border-b border-outline-variant/10 last:border-0 last:pb-0">
                         <div className="flex flex-col">
                            <p className="text-sm font-extrabold text-on-surface">{record.session?.class?.name}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                               {new Date(record.marked_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                            </span>
                         </div>
                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            record.status === 'present' ? 'bg-success-soft text-on-success-soft' :
                            record.status === 'late' ? 'bg-warning-soft text-on-warning-soft' : 'bg-error-soft text-on-error-soft'
                         }`}>
                            {record.status}
                         </span>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT: Financials & Admin */}
        <div className="space-y-8">
           <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm h-full">
              <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-8">{t('financialOverview')}</h3>
              {payments.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                   <span className="material-symbols-outlined text-outline mb-2">payments</span>
                   <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('noPaymentsRecorded')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-all border border-transparent hover:border-outline-variant/10">
                       <div className="w-10 h-10 rounded-xl bg-info-soft text-on-info-soft flex items-center justify-center border border-on-info-soft/10">
                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-on-surface leading-none mb-1">{p.amount} {tc('currency')}</p>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                             {new Date(p.payment_date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                          </p>
                       </div>
                       <div className={`w-2 h-2 rounded-full ${p.status === 'recorded' ? 'bg-tertiary' : 'bg-secondary'}`}></div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="bg-inverse-surface p-8 rounded-3xl text-inverse-on-surface relative overflow-hidden group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-on-surface/10">
              <div className="relative z-10 space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-white">contact_support</span>
                 </div>
                 <h4 className="text-xl font-extrabold tracking-tight leading-tight">{t('needAssistance')}</h4>
                 <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('openSupportTicket')}</p>
              </div>
              <div className="absolute top-0 end-0 w-40 h-40 bg-primary/20 blur-[60px] translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>
        </div>

      </div>
    </div>
  );
}
