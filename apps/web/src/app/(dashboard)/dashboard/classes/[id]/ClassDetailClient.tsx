'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { enrollStudent, removeStudent, enrollTeacher, removeTeacher, updateClass } from '../actions'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ScheduleGrid } from '@/components/ui/ScheduleGrid'

type Member = { id: string; first_name: string; last_name: string; email: string }

interface ClassDetailClientProps {
  cls: {
    id: string
    name: string
    subject: string | null
    schedule: string | null
    capacity: number | null
    level?: string | null
  }
  students: Member[]
  teachers: Member[]
  allStudents: Member[]
  allTeachers: Member[]
  homework: { id: string; title: string; description: string | null; due_date: string | null; created_at: string }[]
  userRole: string
}

export function ClassDetailClient({
  cls, students, teachers, allStudents, allTeachers, userRole
}: ClassDetailClientProps) {
  const t = useTranslations('classes')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [studentToEnroll, setStudentToEnroll] = useState('')
  const [teacherToAssign, setTeacherToAssign] = useState('')
  const [showScheduleEditor, setShowScheduleEditor] = useState(false)
  const [modalError, setModalError] = useState('')
  const [scheduleError, setScheduleError] = useState('')

  const isAdmin = userRole === 'institution_admin'

  async function handleEnroll() {
    if (!studentToEnroll) return
    setModalError('')
    startTransition(async () => {
      const res = await enrollStudent(cls.id, studentToEnroll)
      if (res.error) { setModalError(res.error); return }
      setShowAddStudent(false)
      setStudentToEnroll('')
    })
  }

  async function handleAssignTeacher() {
    if (!teacherToAssign) return
    setModalError('')
    startTransition(async () => {
      const res = await enrollTeacher(cls.id, teacherToAssign)
      if (res.error) { setModalError(res.error); return }
      setShowAddTeacher(false)
      setTeacherToAssign('')
    })
  }

  async function handleRemoveMember(type: 'student' | 'teacher', id: string) {
    startTransition(async () => {
      const res = type === 'student'
        ? await removeStudent(cls.id, id)
        : await removeTeacher(cls.id, id)
      if (res.error) setModalError(res.error)
    })
  }

  async function handleRemoveSlot(idx: number) {
    const currentArr = cls.schedule?.split(';').filter(Boolean) || []
    const newArr = currentArr.filter((_, i) => i !== idx)
    const fd = new FormData()
    fd.set('name', cls.name)
    fd.set('subject', cls.subject || '')
    fd.set('capacity', String(cls.capacity || 30))
    fd.set('schedule', newArr.join('; '))
    const res = await updateClass(cls.id, fd)
    if (res.error) setScheduleError(res.error)
  }

  async function handleAddSlot(day: string, time: string) {
    if (!time) { setScheduleError(tc('error')); return }
    const currentArr = cls.schedule?.split(';').filter(Boolean) || []
    const newArr = [...currentArr, `${day} ${time}`]
    const fd = new FormData()
    fd.set('name', cls.name)
    fd.set('subject', cls.subject || '')
    fd.set('capacity', String(cls.capacity || 30))
    fd.set('schedule', newArr.join('; '))
    const res = await updateClass(cls.id, fd)
    if (res.error) setScheduleError(res.error)
    else setScheduleError('')
  }

  return (
    <div className="space-y-10 pb-12 anim-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-3">
            <Link href="/dashboard/classes" className="hover:text-primary transition-colors text-outline-variant">{t('title')}</Link>
            <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
            <span className="text-on-surface">{cls.name}</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black tracking-tighter text-on-surface uppercase italic leading-none">{cls.name}</h1>
          </div>
          <p className="text-sm text-outline font-bold uppercase tracking-widest opacity-70">
            {cls.subject || t('noSubject')}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAddTeacher(true); setModalError('') }} className="h-12 px-8 bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              {t('joinFaculty')}
            </button>
            <button onClick={() => { setShowAddStudent(true); setModalError('') }} className="h-12 px-8 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
              {t('addStudent')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members table */}
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/30">
              <div>
                <h3 className="text-xl font-black text-on-surface uppercase italic tracking-tighter leading-none">{t('classRegistry')}</h3>
                <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-2 opacity-60">{t('registryDesc')}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary/10 border border-tertiary/20">
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">{t('liveMatrix')}</span>
              </div>
            </div>

            {modalError && (
              <div className="mx-8 mt-4 p-3 bg-error-container/30 border border-error/20 rounded-xl text-error text-xs font-bold">
                {modalError}
              </div>
            )}

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                    <th className="px-8 py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest">{t('member')}</th>
                    <th className="px-8 py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest">{t('role')}</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black text-outline uppercase tracking-widest w-24">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {teachers.map(t_ => (
                    <tr key={t_.id} className="group hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-on-surface text-surface flex items-center justify-center font-black text-sm shadow-md border border-outline-variant/10 uppercase">
                            {t_.first_name[0]}{t_.last_name[0]}
                          </div>
                          <div>
                            <div className="font-black text-on-surface text-base uppercase tracking-tighter leading-tight mb-1">{t_.first_name} {t_.last_name}</div>
                            <div className="text-[10px] text-outline font-bold tracking-widest uppercase opacity-60">{t_.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                          {t('facultyLead')}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {isAdmin && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRemoveMember('teacher', t_.id)}
                              disabled={isPending}
                              className="w-10 h-10 rounded-xl bg-surface-container-high/50 border border-outline-variant/10 text-outline hover:text-error hover:bg-error/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.map(s => (
                    <tr key={s.id} className="group hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface-variant flex items-center justify-center font-black text-sm shadow-sm uppercase">
                            {s.first_name[0]}{s.last_name[0]}
                          </div>
                          <div>
                            <div className="font-black text-on-surface text-base uppercase tracking-tighter leading-tight mb-1">{s.first_name} {s.last_name}</div>
                            <div className="text-[10px] text-outline font-bold tracking-widest uppercase opacity-60">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface-variant text-[9px] font-black uppercase tracking-widest">
                          {t('enrolledLearner')}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {isAdmin && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRemoveMember('student', s.id)}
                              disabled={isPending}
                              className="w-10 h-10 rounded-xl bg-surface-container-high/50 border border-outline-variant/10 text-outline hover:text-error hover:bg-error/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && teachers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center mx-auto mb-6 border border-dashed border-outline-variant/30">
                          <span className="material-symbols-outlined text-outline text-3xl opacity-30">groups_3</span>
                        </div>
                        <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] opacity-60">{tc('empty')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-surface-container-low/30 flex items-center justify-center gap-10 border-t border-outline-variant/10">
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-on-surface leading-tight tabular-nums">{teachers.length}</span>
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest opacity-60">{t('facultyLeads')}</span>
                </div>
                <div className="w-px h-10 bg-outline-variant/20 self-center"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-on-surface leading-tight tabular-nums">{students.length}</span>
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest opacity-60">{t('enrolledStudents')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Schedule */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 start-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-black text-on-surface uppercase italic tracking-tighter flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
                {t('executionWindow')}
              </h3>
              {isAdmin && (
                <button onClick={() => { setShowScheduleEditor(true); setScheduleError('') }} className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/10 text-outline hover:bg-on-surface hover:text-surface transition-all flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </button>
              )}
            </div>
            <ScheduleGrid schedule={cls.schedule} />
            {!cls.schedule && isAdmin && (
              <button onClick={() => setShowScheduleEditor(true)} className="mt-4 text-xs font-bold text-primary hover:underline">
                {t('addTimeSlot')}
              </button>
            )}
          </div>

          {/* Capacity */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-12 -translate-y-12 transition-all group-hover:bg-primary/10"></div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-base font-black text-on-surface uppercase italic tracking-tighter flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                {t('resourceLoad')}
              </h3>
              <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none border ${students.length >= (cls.capacity || 30) ? 'bg-error/10 text-error border-error/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'}`}>
                {students.length >= (cls.capacity || 30) ? t('critical') : t('nominal')}
              </div>
            </div>

            <div className="flex items-end justify-between mb-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ps-1 opacity-60">{t('utilizationIndex')}</span>
                <div className="text-6xl font-black text-on-surface tracking-tighter tabular-nums leading-none">
                  {students.length}<span className="text-outline/30 text-2xl font-light"> / {cls.capacity || 30}</span>
                </div>
              </div>
              <div className="text-xs font-black text-primary uppercase tracking-tighter pb-1.5 bg-primary/10 px-3 py-1 rounded-xl">
                {Math.round((students.length / (cls.capacity || 30)) * 100)}%
              </div>
            </div>

            <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden p-1 border border-outline-variant/10 relative z-10 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${students.length >= (cls.capacity || 30) ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (students.length / (cls.capacity || 30)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-outline mt-6 opacity-50 leading-relaxed uppercase tracking-tight">
              {t('capacityDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Enroll Student Modal */}
      <Modal open={showAddStudent} onClose={() => { setShowAddStudent(false); setModalError('') }} title={t('strategicEnrollment')} size="md">
        <div className="space-y-8 p-6">
          {modalError && (
            <div className="p-4 bg-error-container/30 border border-error/20 rounded-xl text-error text-xs font-bold">{modalError}</div>
          )}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-on-surface-variant leading-relaxed">
            {t('enrollDesc')}
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('selectTargetLearner')}</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">person_search</span>
              <select
                className="w-full h-14 ps-12 pe-10 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                value={studentToEnroll}
                onChange={(e) => setStudentToEnroll(e.target.value)}
              >
                <option value="">{t('searchMember')}</option>
                {allStudents
                  .filter(s => !students.find(es => es.id === s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))
                }
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-8 border-t border-outline-variant/10">
            <button onClick={() => { setShowAddStudent(false); setModalError('') }} className="h-14 px-8 rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all">{tc('cancel')}</button>
            <button
              onClick={handleEnroll}
              disabled={!studentToEnroll || isPending}
              className="h-14 px-10 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('finalizeEnrollment')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal open={showAddTeacher} onClose={() => { setShowAddTeacher(false); setModalError('') }} title={t('facultyAppointment')} size="md">
        <div className="space-y-8 p-6">
          {modalError && (
            <div className="p-4 bg-error-container/30 border border-error/20 rounded-xl text-error text-xs font-bold">{modalError}</div>
          )}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-on-surface-variant leading-relaxed">
            {t('assignDesc')}
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('facultyMember')}</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">badge</span>
              <select
                className="w-full h-14 ps-12 pe-10 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                value={teacherToAssign}
                onChange={(e) => setTeacherToAssign(e.target.value)}
              >
                <option value="">{t('searchFaculty')}</option>
                {allTeachers
                  .filter(t_ => !teachers.find(et => et.id === t_.id))
                  .map(t_ => (
                    <option key={t_.id} value={t_.id}>{t_.first_name} {t_.last_name}</option>
                  ))
                }
              </select>
              <span className="material-symbols-outlined absolute end-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-8 border-t border-outline-variant/10">
            <button onClick={() => { setShowAddTeacher(false); setModalError('') }} className="h-14 px-8 rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all">{tc('cancel')}</button>
            <button
              onClick={handleAssignTeacher}
              disabled={!teacherToAssign || isPending}
              className="h-14 px-10 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('authorizeAccess')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Editor Modal */}
      <Modal open={showScheduleEditor} onClose={() => { setShowScheduleEditor(false); setScheduleError('') }} title={t('operationalScheduling')} size="md">
        <div className="space-y-8 p-6">
          {scheduleError && (
            <div className="p-4 bg-error-container/30 border border-error/20 rounded-xl text-error text-xs font-bold">{scheduleError}</div>
          )}

          {/* Existing slots */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('activeMatrixSlots')}</h4>
            {(cls.schedule?.split(';').filter(Boolean) || []).map((slot, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-on-surface text-surface flex items-center justify-center border border-outline-variant/10 shadow-sm">
                    <span className="text-[10px] font-black tabular-nums">{idx + 1}</span>
                  </div>
                  <span className="text-sm font-black text-on-surface tracking-tight uppercase">{slot}</span>
                </div>
                <button
                  onClick={() => handleRemoveSlot(idx)}
                  disabled={isPending}
                  className="w-9 h-9 rounded-xl text-outline hover:text-error hover:bg-error/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 border border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            {(cls.schedule?.split(';').filter(Boolean) || []).length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-outline-variant/20 rounded-3xl bg-surface-container-low/30">
                <p className="text-[10px] font-black text-outline uppercase tracking-widest opacity-40">{t('noSlots')}</p>
              </div>
            )}
          </div>

          {/* Add new slot */}
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-5">
            <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">{t('newOperationalWindow')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-outline uppercase tracking-widest ps-1">{t('executionDay')}</label>
                <div className="relative group">
                  <select id="new-slot-day" className="w-full h-12 ps-4 pe-10 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-black focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer uppercase">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{t(`days.${d}`)}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-outline uppercase tracking-widest ps-1">{t('timeLatency')}</label>
                <input id="new-slot-time" type="text" className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs font-black placeholder:text-outline/30 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" placeholder={t('timeRangePlaceholder')} />
              </div>
            </div>
            <button
              onClick={() => {
                const day = (document.getElementById('new-slot-day') as HTMLSelectElement).value
                const time = (document.getElementById('new-slot-time') as HTMLInputElement).value
                handleAddSlot(day, time).then(() => {
                  if (!(document.getElementById('new-slot-time') as HTMLInputElement)?.value) return
                  ;(document.getElementById('new-slot-time') as HTMLInputElement).value = ''
                })
              }}
              disabled={isPending}
              className="w-full h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {t('registerSlot')}
            </button>
          </div>

          <div className="flex justify-end pt-6 border-t border-outline-variant/10">
            <button onClick={() => { setShowScheduleEditor(false); setScheduleError('') }} className="h-14 px-10 bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-on-surface hover:text-surface transition-all shadow-sm">{t('finalizeTimeline')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
