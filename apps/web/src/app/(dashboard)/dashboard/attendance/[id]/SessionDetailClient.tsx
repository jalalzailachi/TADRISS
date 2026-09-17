'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { updateAttendanceRecord, deleteAttendanceSession } from '../actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

type Status = 'present' | 'absent' | 'late' | 'excused'

export type StudentRecord = {
  id: string
  student_id: string
  status: Status
  student: { id: string; first_name: string; last_name: string } | null
}

export type Session = {
  id: string
  session_date: string
  notes: string | null
  class_id: string
  class: { id: string; name: string } | null
  teacher: { first_name: string; last_name: string } | null
}

export type ClassStudent = {
  student_id: string
  student: { id: string; first_name: string; last_name: string } | null
}

const STATUSES: { key: Status; icon: string; color: string; activeColor: string }[] = [
  { key: 'present', icon: 'check_circle', color: 'text-outline', activeColor: 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/30' },
  { key: 'late', icon: 'schedule', color: 'text-outline', activeColor: 'bg-secondary text-on-secondary shadow-lg shadow-secondary/30' },
  { key: 'absent', icon: 'cancel', color: 'text-outline', activeColor: 'bg-error text-on-error shadow-lg shadow-error/30' },
  { key: 'excused', icon: 'info', color: 'text-outline', activeColor: 'bg-primary text-on-primary shadow-lg shadow-primary/30' },
]

export function SessionDetailClient({
  session, records, classStudents, isAdmin,
}: {
  session: Session
  records: StudentRecord[]
  classStudents: ClassStudent[]
  isAdmin: boolean
}) {
  const t = useTranslations('attendance')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const backUrl = pathname.startsWith('/teacher') ? '/teacher/attendance' : '/dashboard/attendance'
  const [showDelete, setShowDelete] = useState(false)
  const [toast, setToast] = useState('')

  // Build roster: merge records with class students (handle missing records)
  const rosterMap = new Map<string, Status>()
  for (const r of records) {
    rosterMap.set(r.student_id, r.status as Status)
  }

  const roster = classStudents.map(cs => ({
    studentId: cs.student_id,
    firstName: cs.student?.first_name || '',
    lastName: cs.student?.last_name || '',
    status: rosterMap.get(cs.student_id) || 'present',
  })).sort((a, b) => a.lastName.localeCompare(b.lastName, locale))

  const [statuses, setStatuses] = useState<Map<string, Status>>(
    () => new Map(roster.map(r => [r.studentId, r.status]))
  )

  const handleStatusChange = useCallback((studentId: string, newStatus: Status) => {
    setStatuses(prev => {
      const next = new Map(prev)
      next.set(studentId, newStatus)
      return next
    })
    // Persist immediately
    startTransition(async () => {
      const res = await updateAttendanceRecord(session.id, studentId, newStatus)
      if (res?.error) console.error(res.error)
    })
  }, [session.id, startTransition])

  const handleMarkAll = useCallback((status: Status) => {
    const next = new Map<string, Status>()
    roster.forEach(r => next.set(r.studentId, status))
    setStatuses(next)
    // Persist all
    startTransition(async () => {
      await Promise.all(roster.map(r => updateAttendanceRecord(session.id, r.studentId, status)))
      setToast(t('saved'))
      setTimeout(() => setToast(''), 3000)
    })
  }, [roster, session.id, startTransition, t])

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const res = await deleteAttendanceSession(session.id)
      if (res?.success) router.push(backUrl)
    })
  }, [session.id, router, startTransition, backUrl])

  // Stats
  const total = roster.length
  const presentCount = [...statuses.values()].filter(s => s === 'present').length
  const lateCount = [...statuses.values()].filter(s => s === 'late').length
  const absentCount = [...statuses.values()].filter(s => s === 'absent').length
  const excusedCount = [...statuses.values()].filter(s => s === 'excused').length
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 end-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-tertiary text-on-tertiary text-xs font-black uppercase tracking-widest shadow-xl shadow-tertiary/30 animate-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-widest hover:text-primary transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('backToList')}
          </Link>
          <h1 className="text-2xl font-semibold text-on-surface">
            {session.class?.name || t('sessionDetail')}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-on-surface-variant">
              {new Date(session.session_date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {session.teacher && (
              <span className="text-xs text-outline">
                {session.teacher.first_name} {session.teacher.last_name}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-error-soft text-on-surface-variant hover:text-on-error-soft text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {t('deleteSession')}
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t('present'), count: presentCount, color: 'text-on-success-soft' },
          { label: t('late'), count: lateCount, color: 'text-on-warning-soft' },
          { label: t('absent'), count: absentCount, color: 'text-on-error-soft' },
          { label: t('excused'), count: excusedCount, color: 'text-on-info-soft' },
          { label: t('attendanceRate'), count: `${rate}%`, color: 'text-on-surface' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-xs font-medium text-on-surface-variant">{stat.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Mark All Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-on-surface-variant me-2">{t('markAll')}:</span>
        {STATUSES.map(s => (
          <button
            key={s.key}
            onClick={() => handleMarkAll(s.key)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant text-sm font-medium transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            {t(s.key)}
          </button>
        ))}
      </div>

      {/* Student Roster */}
      {roster.length === 0 ? (
        <EmptyState
          icon="group_off"
          title={t('noStudents')}
          description={t('noStudentsDesc')}
        />
      ) : (
        <div className="rounded-xl border border-outline-variant overflow-hidden">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">{t('student')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 bg-surface-container-lowest">
              {roster.map((student, idx) => {
                const currentStatus = statuses.get(student.studentId) || 'present'
                return (
                  <tr key={student.studentId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-sm text-outline tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-xs font-semibold text-on-surface-variant uppercase">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <span className="text-sm font-medium text-on-surface">
                          {student.firstName} {student.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {STATUSES.map(s => (
                          <button
                            key={s.key}
                            onClick={() => handleStatusChange(student.studentId, s.key)}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              currentStatus === s.key
                                ? s.activeColor
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                            <span className="hidden sm:inline">{t(s.key)}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with pending indicator */}
      {isPending && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-inverse-surface text-inverse-on-surface text-xs font-semibold shadow-xl">
          <div className="w-4 h-4 border-2 border-inverse-on-surface/30 border-t-inverse-on-surface rounded-full animate-spin" />
          {t('saving')}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={t('deleteSession')}
        description={t('deleteSessionDesc')}
        loading={isPending}
      />
    </div>
  )
}
