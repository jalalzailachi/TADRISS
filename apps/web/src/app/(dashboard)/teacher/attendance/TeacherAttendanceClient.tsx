'use client'

import { useState, useTransition } from 'react'
import { createAttendanceSession, submitAttendance, getStudentsForClass } from './actions'
import { Modal } from '@/components/ui/Modal'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StudentRecord {
  id: string
  name: string
  status: 'present' | 'absent' | 'late'
}

export type SessionSummary = {
  id: string
  session_date: string
  class: { name: string } | null
  records: { count: number }[]
}

export type AssignedClass = { id: string; name: string }

type ActiveSession = { id: string; classId: string; date: string }

export function TeacherAttendanceClient(
  { sessions, assignedClasses }: { sessions: SessionSummary[]; assignedClasses: AssignedClass[] }
) {
  const t = useTranslations('attendance')
  const locale = useLocale()
  const router = useRouter()
  
  const [showCreate, setShowCreate] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // 1. Start a new session or open an existing one
  async function handleOpenSession(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createAttendanceSession(formData)
      if (res?.error) { 
        setError(res.error)
        return 
      }
      
      const classId = formData.get('class_id') as string
      const date = formData.get('date') as string
      
      const studentsRes = await getStudentsForClass(classId)
      if (studentsRes.error) {
        setError(studentsRes.error)
        return
      }

      setStudents(studentsRes.students!.map((s) => ({ ...s, status: 'present' as const })))
      setActiveSession({ id: res.sessionId, classId, date })
      setShowCreate(false)
    })
  }

  // 2. Submit the records
  async function handleSaveAttendance() {
    if (!activeSession) return
    setError('')
    startTransition(async () => {
      const records = students.map(s => ({ studentId: s.id, status: s.status }))
      const res = await submitAttendance(activeSession.id, records)
      if (res?.error) {
        setError(res.error)
        return
      }
      setActiveSession(null)
      router.refresh()
    })
  }

  const updateStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s))
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-outline-variant/10">
        <div>
          <h1 className="text-4xl font-black text-on-surface uppercase tracking-tighter">{t('title')}</h1>
          <p className="text-sm text-outline font-bold uppercase tracking-widest mt-1">Teacher Operations Terminal</p>
        </div>
        {!activeSession && (
          <button 
            onClick={() => setShowCreate(true)} 
            className="h-12 px-8 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {t('newSession')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-sm font-bold flex items-center gap-3 animate-shake">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {/* ACTIVE MARKING VIEW */}
      {activeSession ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-on-surface text-white flex flex-col items-center justify-center font-black">
                 <span className="text-[10px] uppercase leading-none opacity-70 mb-1">{new Date(activeSession.date).toLocaleDateString(locale, { month: 'short' })}</span>
                 <span className="text-2xl leading-none">{new Date(activeSession.date).toLocaleDateString(locale, { day: 'numeric' })}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Marking Attendance</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-widest">
                    {assignedClasses.find((c) => c.id === activeSession.classId)?.name}
                  </span>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none">• {students.length} Students</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
               <button 
                 onClick={() => setActiveSession(null)} 
                 className="h-12 px-6 rounded-xl border border-outline-variant/30 text-[11px] font-black uppercase tracking-widest text-outline hover:bg-surface-container-high transition-all"
                 disabled={isPending}
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSaveAttendance} 
                 className="h-12 px-8 bg-tertiary text-on-tertiary rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                 disabled={isPending}
               >
                 {isPending ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <span className="material-symbols-outlined">check_circle</span>
                 )}
                 {t('saveAttendance')}
               </button>
            </div>
          </div>

          <div className="px-4 py-2 bg-warning-soft border-b border-on-warning-soft/10 flex items-center justify-center gap-3">
             <span className="material-symbols-outlined text-on-warning-soft text-[18px]">info</span>
             <p className="text-[10px] font-bold text-on-warning-soft uppercase tracking-widest">{t('present')} — {t('markAll')}</p>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {students.map((student) => (
              <div key={student.id} className="p-6 flex items-center justify-between group hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-black text-sm text-outline group-hover:bg-on-surface group-hover:text-white transition-all">
                    {student.name[0]}
                  </div>
                  <span className="text-sm font-black text-on-surface uppercase tracking-tight">{student.name}</span>
                </div>
                
                <div className="flex bg-surface-container-high p-1.5 rounded-2xl gap-2">
                  <button
                    onClick={() => updateStatus(student.id, 'present')}
                    className={`h-11 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      student.status === 'present'
                        ? 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/30'
                        : 'text-outline hover:text-tertiary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    {t('present')}
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, 'late')}
                    className={`h-11 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      student.status === 'late'
                        ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/30'
                        : 'text-outline hover:text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {t('late')}
                  </button>
                  <button
                    onClick={() => updateStatus(student.id, 'absent')}
                    className={`h-11 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      student.status === 'absent'
                        ? 'bg-error text-on-error shadow-lg shadow-error/30'
                        : 'text-outline hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    {t('absent')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-surface-container-low flex justify-end gap-4 border-t border-outline-variant/10">
             <button 
               onClick={handleSaveAttendance} 
               className="h-14 px-12 bg-on-surface text-white rounded-2xl font-black uppercase tracking-[0.1em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-on-surface/10 disabled:opacity-50"
               disabled={isPending}
             >
               Finalize Call
             </button>
          </div>
        </div>
      ) : (
        /* SESSIONS LIST VIEW */
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-8 py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest">{t('date')}</th>
                <th className="px-8 py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest">{t('class')}</th>
                <th className="px-8 py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest">{t('stats')}</th>
                <th className="px-8 py-5 text-end text-[10px] font-black text-outline uppercase tracking-widest">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {sessions.map((s) => {
                const p = s.records?.[0]?.count || 0
                return (
                  <tr key={s.id} className="group hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center border border-outline-variant/10 font-black group-hover:bg-primary group-hover:text-white transition-all text-on-surface">
                             <span className="text-[10px] uppercase leading-none pt-1">{new Date(s.session_date).toLocaleDateString(locale, { month: 'short' })}</span>
                             <span className="text-xl leading-none">{new Date(s.session_date).toLocaleDateString(locale, { day: 'numeric' })}</span>
                          </div>
                          <span className="text-[11px] font-black text-on-surface uppercase tracking-widest">{new Date(s.session_date).toLocaleDateString(locale, { weekday: 'long' })}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 font-black text-sm text-on-surface uppercase tracking-tight">{s.class?.name}</td>
                    <td className="px-8 py-5 font-bold text-xs text-outline tabular-nums italic">{p} Recorded Présences</td>
                    <td className="px-8 py-5 text-end">
                       <Link href={`/teacher/attendance/${s.id}`} className="h-10 px-6 inline-flex items-center rounded-xl bg-surface-container-high hover:bg-on-surface hover:text-white text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">{t('details')}</Link>
                    </td>
                  </tr>
                )
              })}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-outline font-bold uppercase tracking-widest text-xs">No attendance history available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Attendance Roll Call">
        <form action={handleOpenSession} className="space-y-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('class')} *</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">auto_stories</span>
                <select name="class_id" className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required>
                  <option value="">Choose Class</option>
                  {assignedClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('date')} *</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">calendar_today</span>
                <input 
                  type="date" 
                  name="date" 
                  className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
                  required 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-end pt-8">
            <button 
              type="button" 
              onClick={() => setShowCreate(false)} 
              className="h-14 px-8 rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all"
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="h-14 px-10 bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-on-surface/10"
              disabled={isPending}
            >
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? 'Connecting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
