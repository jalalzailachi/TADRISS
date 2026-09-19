'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createHomework, updateHomework, deleteHomework } from './actions'
import { useTranslations, useLocale } from 'next-intl'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

import { Database } from '@tadriss/shared'

export type Class = Database['public']['Tables']['classes']['Row']

export type Homework = {
  id: string
  institution_id: string
  class_id: string
  teacher_id: string
  title: string
  description: string | null
  due_date: string | null
  file_url: string | null
  created_at: string
  updated_at: string
  class?: { id: string; name: string } | null
}

export function HomeworkClient({ homework, classes }: { homework: Homework[], classes: Class[] }) {
  const t = useTranslations('homework')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Homework | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createHomework(formData)
      if (res?.error) { setError(res.error); return }
      setShowCreate(false)
    })
  }

  async function handleUpdate(formData: FormData) {
    if (!editTarget) return
    setError('')
    startTransition(async () => {
      const res = await updateHomework(editTarget.id, formData)
      if (res?.error) { setError(res.error); return }
      setEditTarget(null)
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteHomework(deleteTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteTarget(null)
    })
  }

  const filteredHomework = homework.filter((hw: Homework) => 
    hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hw.class?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <PageHeader 
        title={t('title')}
        subtitle={t('subtitle')}
        count={homework.length.toString()}
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
              <span className="material-symbols-outlined text-[20px]">assignment_add</span>
              {t('assign')}
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-xs font-black uppercase tracking-tight flex items-center gap-3 animate-shake">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {filteredHomework.length === 0 ? (
        <div className="anim-in">
          <EmptyState 
            title={t('noHomework')}
            description={t('emptyDescription')}
            icon="auto_stories"
            action={
              <button 
                onClick={() => setShowCreate(true)}
                className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10"
              >
                {t('assign')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 anim-in">
          {filteredHomework.map((hw: Homework) => (
            <div key={hw.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-6 group hover:translate-y-[-4px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full bg-linear-to-br from-surface-container-lowest to-surface-container-low/30">
               <div className="flex justify-between items-start mb-4">
                  <div className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/10 text-on-surface text-[9px] font-black uppercase tracking-widest">
                     {hw.class?.name}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { setEditTarget(hw); setError('') }} className="w-8 h-8 rounded-xl bg-surface-container-high/50 border border-outline-variant/10 text-outline hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                     </button>
                     <button onClick={() => setDeleteTarget(hw)} className="w-8 h-8 rounded-xl bg-surface-container-high/50 border border-outline-variant/10 text-outline hover:bg-error hover:text-white transition-all flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                     </button>
                  </div>
               </div>
               
               <h3 className="text-lg font-black text-on-surface mb-2 leading-tight uppercase tracking-tighter italic border-s-4 border-primary ps-4">{hw.title}</h3>
               <p className="text-xs text-on-surface-variant mb-6 line-clamp-3 font-medium tracking-tight flex-1 opacity-80">{hw.description}</p>
               
               <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-outline uppercase tracking-widest leading-none mb-1 opacity-60">{t('due')}</span>
                        <span className={`text-[10px] font-black uppercase tracking-tight ${(hw.due_date && new Date(hw.due_date) < new Date()) ? 'text-error' : 'text-on-surface'}`}>
                           {hw.due_date ? new Date(hw.due_date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : t('noLimit')}
                        </span>
                     </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/10 text-[9px] font-black text-outline uppercase tracking-widest truncate max-w-[120px]">
                     {hw.class?.name || '—'}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODALS */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('assign')} size="md">
        <HomeworkForm classes={classes} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={isPending} error={error} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t('edit')} size="md">
        {editTarget && (
          <HomeworkForm 
            defaultValues={{...editTarget, class_id: editTarget.class?.id}} 
            classes={classes} 
            onSubmit={handleUpdate} 
            onCancel={() => setEditTarget(null)} 
            loading={isPending} 
            error={error} 
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete')}
        description={t('deleteDesc', { title: deleteTarget?.title || '' })}
        loading={isPending}
      />
    </div>
  )
}

function HomeworkForm({ defaultValues, classes, onSubmit, onCancel, loading, submitLabel }: { 
  defaultValues?: Partial<Homework & { class_id: string }>, 
  classes: Class[], 
  onSubmit: (formData: FormData) => void, 
  onCancel: () => void, 
  loading: boolean, 
  submitLabel?: string,
  error?: string
}) {
  const t = useTranslations('homework')
  const tc = useTranslations('common')
  const tcl = useTranslations('classes')

  return (
    <form action={onSubmit} className="space-y-6 p-2">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{tc('title')} *</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">title</span>
          <input name="title" className="w-full h-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.title ?? ''} placeholder={t('titlePlaceholder')} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{tcl('class')} *</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">school</span>
            <select name="class_id" className="w-full h-12 ps-12 pe-10 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer" required defaultValue={defaultValues?.class_id}>
              <option value="">{tcl('selectClass')}</option>
              {classes?.map((c: Class) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="material-symbols-outlined absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('dueDate')} *</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">event</span>
            <input name="due_date" type="datetime-local" className="w-full h-12 rtl:pr-12 ltr:pl-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.due_date ? new Date(defaultValues.due_date).toISOString().slice(0, 16) : ''} />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('description')}</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute start-4 top-4 text-outline text-[20px] pointer-events-none">description</span>
          <textarea name="description" className="w-full min-h-[120px] rtl:pr-12 ltr:pl-12 ps-12 pe-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none" defaultValue={defaultValues?.description ?? ''} placeholder={t('instructionPlaceholder')} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-6">
        <button type="button" onClick={onCancel} className="h-12 px-6 rounded-2xl text-sm font-bold text-outline hover:bg-surface-container-high transition-all" disabled={loading}>{tc('cancel')}</button>
        <button type="submit" className="h-12 px-8 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2" disabled={loading}>
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? tc('loading') : (submitLabel || t('assign'))}
        </button>
      </div>
    </form>
  )
}
