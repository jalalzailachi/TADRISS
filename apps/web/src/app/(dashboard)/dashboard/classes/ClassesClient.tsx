'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createClass, updateClass, deleteClass } from './actions'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScheduleGrid } from '@/components/ui/ScheduleGrid'

export type Class = {
  id: string
  name: string
  subject: string | null
  schedule: string | null
  capacity: number | null
  created_at: string
  class_students: { count: number }[]
  class_teachers: { profiles: { id: string; full_name: string } | null }[]
}

export function ClassesClient({ classes }: { classes: Class[] }) {
  const t = useTranslations('classes')
  const tc = useTranslations('common')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Class | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  function getStudentCount(cls: Class) {
    return cls.class_students?.[0]?.count ?? 0
  }

  function getTeacher(cls: Class) {
    return cls.class_teachers?.[0]?.profiles?.full_name ?? null
  }

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createClass(formData)
      if (res?.error) { setError(res.error); return }
      setShowCreate(false)
    })
  }

  async function handleUpdate(formData: FormData) {
    if (!editTarget) return
    setError('')
    startTransition(async () => {
      const res = await updateClass(editTarget.id, formData)
      if (res?.error) { setError(res.error); return }
      setEditTarget(null)
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteClass(deleteTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title={t('title')} 
        subtitle={t('subtitle', { count: classes.length })}
        count={classes.length.toString()}
        action={
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">search</span>
              <input 
                type="text" 
                placeholder={tc('search')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
            <button
              onClick={() => { setShowCreate(true); setError('') }}
              className="h-11 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              {t('create')}
            </button>
          </div>
        }
      />

      {/* Mobile Search */}
      <div className="md:hidden relative group">
        <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
        <input
          type="text"
          placeholder={tc('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary transition-all outline-none"
        />
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-xs font-black uppercase tracking-tight flex items-center gap-3 animate-shake">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {filteredClasses.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
          <EmptyState 
            icon="apartment" 
            title={t('noClasses')} 
            description={t('noClassesDesc')} 
            action={
              <button 
                onClick={() => { setSearchQuery(''); setShowCreate(true); }} 
                className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                {t('create')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="card-premium p-6 group hover:border-primary/30 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
               {/* Decorative Gradient */}
               <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
               
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-outline-variant/10 flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform">
                      {cls.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="relative">
                      <button className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-all group-hover:opacity-0">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                      <div className="absolute top-0 end-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                        <button onClick={() => { setEditTarget(cls); setError('') }} className="w-8 h-8 rounded-lg bg-white border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/50 flex items-center justify-center transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => { setDeleteTarget(cls); setError('') }} className="w-8 h-8 rounded-lg bg-white border border-outline-variant/20 text-outline hover:text-danger hover:border-danger/50 flex items-center justify-center transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                   </div>
                </div>

                <div className="mb-6 relative z-10 flex-1">
                   <h3 className="text-xl font-black text-on-surface leading-tight transition-colors group-hover:text-primary truncate uppercase tracking-tighter">
                     {cls.name}
                   </h3>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4 bg-primary/5 inline-block px-2 py-0.5 rounded-full">{cls.subject || t('noSubject')}</p>

                   <div className="space-y-3">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-outline">groups</span>
                      <span className="text-xs font-bold font-mono">
                        {getStudentCount(cls)} <span className="text-outline font-medium opacity-60">/ {cls.capacity || '∞'} {t('students_short')}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-outline">account_circle</span>
                      <span className="text-xs font-bold truncate">{getTeacher(cls) || <span className="italic font-medium text-outline">{t('noTeacherAssigned')}</span>}</span>
                    </div>
                    {cls.schedule && (
                      <ScheduleGrid schedule={cls.schedule} compact />
                    )}
                  </div>
               </div>

             <div className="pt-6 border-t border-outline-variant/10 relative z-10 mt-auto">
                <Link href={`/dashboard/classes/${cls.id}`} className="flex items-center justify-center h-12 w-full bg-surface-container-low hover:bg-on-surface hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all group-hover:shadow-lg group-hover:shadow-primary/5">
                  {t('manageClass')} →
                </Link>
             </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError('') }} title={t('createModalTitle')}>
        <ClassForm onSubmit={handleCreate} onCancel={() => { setShowCreate(false); setError('') }} loading={isPending} error={error} submitLabel={t('create')} />
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); setError('') }} title={t('editModalTitle')}>
        {editTarget && (
          <ClassForm defaultValues={editTarget} onSubmit={handleUpdate} onCancel={() => { setEditTarget(null); setError('') }} loading={isPending} error={error} submitLabel={t('saveChanges')} />
        )}
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setError('') }} onConfirm={handleDelete} title={t('deleteConfirmTitle')} description={t('deleteConfirmDescription', { name: deleteTarget?.name || '' })} confirmLabel={tc('delete') || 'Delete'} loading={isPending} />
    </div>
  )
}

type ClassFormProps = {
  defaultValues?: Partial<Class>
  onSubmit: (formData: FormData) => void | Promise<void>
  onCancel: () => void
  loading: boolean
  error: string
  submitLabel: string
}

function ClassForm({ defaultValues, onSubmit, onCancel, loading, error, submitLabel }: ClassFormProps) {
  const t = useTranslations('classes')
  const tc = useTranslations('common')
  return (
    <form action={onSubmit} className="space-y-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('name')} *</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">auto_stories</span>
            <input name="name" className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.name} placeholder={t('namePlaceholder')} />
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('subject')}</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">layers</span>
            <input name="subject" className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" defaultValue={defaultValues?.subject ?? undefined} placeholder={t('subjectPlaceholder')} />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('schedule')}</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">calendar_today</span>
          <input name="schedule" className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" defaultValue={defaultValues?.schedule ?? undefined} placeholder={t('schedulePlaceholder')} />
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('capacity')}</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[22px] pointer-events-none">groups</span>
          <input name="capacity" type="number" min="1" max="500" className="w-full h-14 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" defaultValue={defaultValues?.capacity ?? 30} placeholder={t('capacityPlaceholder')} />
        </div>
      </div>
      {error && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-[11px] font-black uppercase tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error_outline</span>
          {error}
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-8 border-t border-outline-variant/10">
        <button type="button" onClick={onCancel} className="h-14 px-8 w-full sm:w-auto rounded-2xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all" disabled={loading}>{tc('cancel')}</button>
        <button type="submit" className="h-14 px-10 w-full sm:w-auto bg-on-surface text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 whitespace-nowrap" disabled={loading}>
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? tc('loading') : submitLabel}
        </button>
      </div>
    </form>
  )
}
