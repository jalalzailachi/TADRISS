'use client'

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import Link from 'next/link';

interface DashboardActivity {
  id: string;
  type: 'payment' | 'attendance';
  date: Date;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

type AdminStats = {
  total_students: number
  total_teachers: number
  total_classes: number
  monthly_revenue: number
}

export function AdminDashboard({
  initialStats,
  initialActivities,
  initialUserName
}: {
  userId: string,
  initialStats: AdminStats | null,
  initialActivities: DashboardActivity[],
  initialUserName: string
}) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [stats] = useState(initialStats);
  const [userName] = useState(initialUserName);
  const [activities] = useState<DashboardActivity[]>(initialActivities);

  // We can still use Realtime handles here if needed, but the initial load is now instant

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RealtimeRefresh table="payments" />
      <RealtimeRefresh table="attendance_sessions" />

      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-outline-variant/10">
        <div>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-outline mb-3">
              <span className="text-primary italic">{t('systemStatus')}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
              <span className="text-on-surface">{t('commandCenter')}</span>
           </div>
           <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface uppercase italic mb-2 leading-tight">
            {t('goodMorning', { name: userName })}
          </h2>
          <p className="text-sm font-bold text-outline uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-in">
        {/* Total Students */}
        <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 dark:bg-primary/15 text-primary flex items-center justify-center border border-primary/10 dark:border-primary/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <span className="text-[10px] font-black text-on-success-soft bg-success-soft px-2 py-0.5 rounded-md uppercase tracking-widest">{t('active')}</span>
          </div>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('totalStudents')}</p>
          <p className="text-4xl font-black text-on-surface tracking-tighter tabular-nums leading-none counter-animate">
            {stats.total_students.toLocaleString()}
          </p>
          <div className="absolute bottom-0 start-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Total Teachers */}
        <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group hover:border-info-soft/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-info-soft text-on-info-soft flex items-center justify-center border border-on-info-soft/10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">diversity_3</span>
            </div>
            <span className="text-[10px] font-black text-on-info-soft bg-info-soft px-2 py-0.5 rounded-md uppercase tracking-widest">{t('active')}</span>
          </div>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('totalTeachers')}</p>
          <p className="text-4xl font-black text-on-surface tracking-tighter tabular-nums leading-none counter-animate">
            {stats.total_teachers.toLocaleString()}
          </p>
          <div className="absolute bottom-0 start-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Total Classes */}
        <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group hover:border-teacher-soft/30 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teacher-soft text-on-teacher-soft flex items-center justify-center border border-on-teacher-soft/10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
            </div>
            <span className="text-[10px] font-black text-on-teacher-soft bg-teacher-soft px-2 py-0.5 rounded-md uppercase tracking-widest">{t('active')}</span>
          </div>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ps-1 italic">{t('totalClasses')}</p>
          <p className="text-4xl font-black text-on-surface tracking-tighter tabular-nums leading-none counter-animate">
            {stats.total_classes.toLocaleString()}
          </p>
          <div className="absolute bottom-0 start-0 w-full h-1 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Revenue */}
        <div className="bg-on-surface p-8 rounded-3xl border border-on-surface shadow-xl shadow-on-surface/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="absolute top-0 end-0 w-32 h-32 bg-white/5 blur-[60px] rounded-full translate-x-12 -translate-y-12 shrink-0"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-3xl">database</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></div>
              <span className="text-[9px] font-black text-tertiary uppercase tracking-widest">{t('liveFlow')}</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ps-1 italic relative z-10">{t('revenue')}</p>
          <div className="flex items-end gap-2 relative z-10">
            <p className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
              {stats.monthly_revenue.toLocaleString()}
            </p>
            <span className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-1 italic">{tc('currency')}</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout — 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        
        {/* LEFT: Activity & Monitoring */}
        <div className="space-y-8">
          {/* Institutional Progress Tracking */}
          <div className="bg-on-surface p-6 sm:p-12 min-h-[280px] sm:h-[420px] rounded-3xl sm:rounded-[48px] relative overflow-hidden flex flex-col justify-end group border border-on-surface shadow-2xl shadow-on-surface/20">
             <div className="absolute top-0 end-0 w-[400px] h-[400px] bg-primary/20 blur-[150px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-primary/30 transition-colors"></div>
             <div className="absolute -top-20 -start-20 w-64 h-64 bg-accent/10 blur-[100px] rounded-full"></div>
             
             <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                   <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse shadow-lg shadow-tertiary/50"></span>
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t('operationalExcellence')}</span>
                </div>
                <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[1.05] max-w-xl uppercase italic">
                   {t.rich('efficiencyReach', { percent: '94.2%', span: (chunks) => <span className="text-primary">{chunks}</span> })}
                </h3>
                <div className="flex gap-4 pt-6">
                   <Link href="/dashboard/classes" className="h-12 sm:h-14 px-6 sm:px-10 bg-white text-on-surface rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-black/20 flex items-center gap-3">
                      {t('systemsAudit')}
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                   </Link>
                </div>
             </div>
             
             {/* Dynamic background pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>

          {/* Activity Logs */}
          <div className="bg-surface-container-lowest dark:bg-surface-container p-5 sm:p-10 rounded-2xl sm:rounded-[40px] border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black tracking-tighter text-on-surface uppercase italic leading-none mb-3">{t('recentActivity')}</h3>
                  <p className="text-[10px] text-outline font-black uppercase tracking-widest">{t('activitySubtitle')}</p>
               </div>
               <button className="h-10 px-5 bg-surface-container-high text-outline hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-outline-variant/10">
                {t('viewAll')}
              </button>
            </div>
            
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-24 text-center bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/20">
                <div className="w-20 h-20 rounded-[32px] bg-surface-container-high flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-outline text-4xl">inventory_2</span>
                </div>
                <p className="text-base font-black text-on-surface uppercase italic tracking-widest">{t('noActivity')}</p>
                <p className="text-[10px] text-outline mt-2 font-bold uppercase tracking-widest">{t('activitiesDesc')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="group relative flex items-center gap-6 p-5 rounded-3xl transition-all hover:bg-surface-container-low border border-transparent hover:border-outline-variant/10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-current/10 shadow-sm transition-transform group-hover:scale-105 ${act.color}`}>
                      <span className="material-symbols-outlined text-[28px]">{act.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <p className="text-base font-black text-on-surface truncate leading-none uppercase italic tracking-tight">{t(act.title)}</p>
                        <span className="text-[10px] font-black text-outline shrink-0 ms-4 uppercase tracking-[0.1em] opacity-60">
                          {act.date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-outline truncate uppercase tracking-tight">{act.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline/20 text-xl opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: High Performance Actions */}
        <div className="space-y-8">
          <div className="bg-surface-container-lowest dark:bg-surface-container p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-[11px] font-bold text-outline uppercase tracking-[0.2em] mb-8">{t('quickActions')}</h3>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/dashboard/students">
                <button className="w-full flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl group hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface">{t('addStudent')}</span>
                </button>
              </Link>
              <Link href="/dashboard/teachers">
                <button className="w-full flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl group hover:border-accent transition-all hover:shadow-xl hover:shadow-accent/5 active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-accent/5 text-accent flex items-center justify-center border border-accent/10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">group_add</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface">{t('inviteTeacher')}</span>
                </button>
              </Link>
              <Link href="/dashboard/classes">
                <button className="w-full flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl group hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">library_add</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface">{t('createClass')}</span>
                </button>
              </Link>
              <Link href="/dashboard/payments">
                <button className="w-full flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl group hover:border-tertiary transition-all hover:shadow-xl hover:shadow-tertiary/5 active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/5 text-tertiary flex items-center justify-center border border-tertiary/10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface">{t('addPayment')}</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-6 sm:p-8 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden group">
             <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                   <span className="material-symbols-outlined text-sm text-accent">tips_and_updates</span>
                   <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{t('smartSuggestion')}</span>
                </div>
                <h4 className="text-lg font-extrabold text-on-surface-variant tracking-tight leading-tight">
                   {t('attendanceReminder')}
                </h4>
                <Link href="/dashboard/attendance" className="inline-block text-xs font-bold text-primary group-hover:underline uppercase tracking-widest">
                   {t('verifyNow')}
                </Link>
             </div>
             <div className="absolute bottom-0 end-0 w-24 h-24 bg-accent/10 rounded-full blur-[40px] translate-x-1/2 translate-y-1/2"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
