'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createAttendanceSession } from './actions'
import { useTranslations, useLocale } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'

import { Database } from '@tadriss/shared'

export type AttendanceSession = Database['public']['Tables']['attendance_sessions']['Row'] & {
  class: { name: string } | null
  records: { status: 'present' | 'absent' | 'late' | string }[]
}

export type Class = Database['public']['Tables']['classes']['Row']

export function AttendanceClient({ sessions, classes }: { sessions: AttendanceSession[], classes: Class[] }) {
  const t = useTranslations('attendance')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createAttendanceSession(formData)
      if (res?.error) { setError(res.error); return }
      setShowCreate(false)
    })
  }

  const filteredSessions = sessions.filter((s: AttendanceSession) => 
    s.class?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns = [
    {
      key: 'date',
      label: t('date'),
      render: (s: AttendanceSession) => (
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex flex-col items-center justify-center border border-outline-variant/10 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
            <span className="text-[9px] font-black leading-none uppercase pt-1 opacity-70">{new Date(s.session_date).toLocaleDateString(locale, { month: 'short' })}</span>
            <span className="text-lg font-black leading-none">{new Date(s.session_date).toLocaleDateString(locale, { day: 'numeric' })}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-on-surface uppercase tracking-tight">{new Date(s.session_date).toLocaleDateString(locale, { weekday: 'long' })}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60">{t('recordedSession')}</span>
          </div>
        </div>
      )
    },
    {
      key: 'class',
      label: t('class'),
      render: (s: AttendanceSession) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-on-surface uppercase tracking-tight">{s.class?.name}</span>
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60">{t('morningPeriod')}</span>
        </div>
      )
    },
    {
      key: 'stats',
      label: t('stats'),
      render: (s: AttendanceSession) => {
        const p = s.records.filter((r) => r.status === 'present').length
        const a = s.records.filter((r) => r.status === 'absent').length
        const l = s.records.filter((r) => r.status === 'late').length
        return (
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-soft border border-on-success-soft/10 text-on-success-soft text-[9px] font-black uppercase tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              {p} {t('presentAbbr')}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning-soft border border-on-warning-soft/10 text-on-warning-soft text-[9px] font-black uppercase tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              {l} {t('lateAbbr')}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-error-soft border border-on-error-soft/10 text-on-error-soft text-[9px] font-black uppercase tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              {a} {t('absentAbbr')}
            </div>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: t('status'),
      render: (s: AttendanceSession) => {
        const p = s.records.filter((r) => r.status === 'present').length
        const l = s.records.filter((r) => r.status === 'late').length
        const total = s.records.length
        const rate = total > 0 ? Math.round(((p + l) / total) * 100) : 0
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10">
              <div className={`h-full transition-all duration-1000 ${rate > 80 ? 'bg-tertiary' : rate > 50 ? 'bg-secondary' : 'bg-error'}`} style={{width: `${rate}%`}} />
            </div>
            <span className="text-[10px] font-black text-on-surface tabular-nums">{rate}%</span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: '',
      render: (s: AttendanceSession) => (
        <div className="flex justify-end pe-2">
          <a href={`/dashboard/attendance/${s.id}`} className="h-9 px-5 inline-flex items-center justify-center bg-surface-container-high/50 hover:bg-on-surface hover:text-white border border-outline-variant/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm">
            {t('details')}
          </a>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader 
        title={t('title')} 
        subtitle={t('subtitle', { count: sessions.length })}
        action={
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">search</span>
              <input 
                type="text" 
                placeholder={tc('search')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-11 ps-11 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
            <button 
              onClick={() => { setShowCreate(true); setError('') }} 
              className="h-11 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              {t('newSession')}
            </button>
          </div>
        }
      />

      {/* Mobile Search */}
      <div className="md:hidden relative group mb-6">
        <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
        <input
          type="text"
          placeholder={tc('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 ps-11 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary transition-all outline-none"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-xs font-black uppercase tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error_outline</span>
          {error}
        </div>
      )}

      <div className="anim-in">
        <DataTable 
          data={filteredSessions}
          columns={columns}
          emptyState={
            <EmptyState 
              icon="event_busy" 
              title={t('noSessions')} 
              description={t('emptyDescription')}
              action={
                <button 
                  onClick={() => setShowCreate(true)} 
                  className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10"
                >
                  {t('newSession')}
                </button>
              }
            />
          }
          itemsPerPage={12}
        />
      </div>

      {/* CREATE MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('createSession')}>
        <form action={handleCreate} className="space-y-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('class')} *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">school</span>
                <select name="class_id" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="">{t('selectClass')}</option>
                  {classes?.filter(Boolean).map((c: Class) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('date')} *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">calendar_today</span>
                <input name="session_date" type="date" className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('notes')}</label>
            <div className="relative">
               <span className="material-symbols-outlined absolute start-4 top-4 text-outline text-[22px] pointer-events-none">description</span>
               <textarea name="notes" className="w-full min-h-[140px] ps-12 pe-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none" placeholder={t('notesPlaceholder')} />
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-8">
            <button type="button" onClick={() => setShowCreate(false)} className="h-11 px-8 rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all" disabled={isPending}>{tc('cancel')}</button>
            <button type="submit" className="h-11 px-10 bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3" disabled={isPending}>
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? t('starting') : t('confirmSession')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
