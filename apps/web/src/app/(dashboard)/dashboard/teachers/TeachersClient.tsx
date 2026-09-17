'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { addTeacher, updateTeacher, deleteTeacher } from './actions'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'

export type Teacher = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  class_teachers: { class: { id: string; name: string } }[]
}

export function TeachersClient({ teachers }: { teachers: Teacher[] }) {
  const t = useTranslations('teachers')
  const tc = useTranslations('common')
  const ts = useTranslations('students')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Teacher | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
  const [error, setError] = useState('')
  const [successPassword, setSuccessPassword] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(currentQuery)

  const handleSearch = (val: string) => {
    setSearchQuery(val)
    const params = new URLSearchParams(searchParams)
    if (val) {
      params.set('q', val)
    } else {
      params.delete('q')
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const filteredTeachers = teachers.filter(teacher => 
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await addTeacher(formData)
      if (res?.error) { setError(res.error); return }
      if (res?.success && res?.password) {
        setSuccessPassword(res.password)
      }
      setShowCreate(false)
    })
  }

  async function handleUpdate(formData: FormData) {
    if (!editTarget) return
    setError('')
    startTransition(async () => {
      const res = await updateTeacher(editTarget.id, formData)
      if (res?.error) { setError(res.error); return }
      setEditTarget(null)
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteTeacher(deleteTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteTarget(null)
    })
  }

  const columns = [
    {
      key: 'teacher',
      label: t('teacher'),
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-sm border border-secondary/20 uppercase">
            {teacher.first_name?.[0]}{teacher.last_name?.[0]}
          </div>
          <div>
            <p className="text-sm font-black text-on-surface uppercase tracking-tight">
              {teacher.first_name} {teacher.last_name}
            </p>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60">{ts('joined')} {new Date(teacher.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: ts('contact'),
      render: (teacher: Teacher) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-outline opacity-50">mail</span>
            {teacher.email}
          </div>
          {teacher.phone && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-outline tracking-wider opacity-60">
              <span className="material-symbols-outlined text-[16px]">call</span>
              {teacher.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'classes',
      label: t('title'),
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-primary tabular-nums">{teacher.class_teachers?.length || 0}</span>
          <span className="text-[10px] font-black text-outline uppercase tracking-widest opacity-60">{ts('classes')}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: '', 
      render: (teacher: Teacher) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditTarget(teacher)} className="w-9 h-9 rounded-xl text-outline hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onClick={() => setDeleteTarget(teacher)} className="w-9 h-9 rounded-xl text-outline hover:text-error hover:bg-error/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8">
      <PageHeader 
        title={t('title')} 
        subtitle={t('subtitle', { count: teachers.length })}
        count={teachers.length.toString()}
        action={
          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px] pointer-events-none">search</span>
              <input 
                type="text" 
                placeholder={tc('search')} 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>
            <button
              onClick={() => { setShowCreate(true); setError('') }}
              className="h-11 px-6 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              {t('invite')}
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
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-11 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary transition-all outline-none"
        />
      </div>

      <div className="anim-in">
        <DataTable 
          data={filteredTeachers}
          columns={columns}
          emptyMessage={t('noTeachers')}
          itemsPerPage={12}
        />
      </div>

      {/* CREATE/EDIT MODALS */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('invite')}>
        <TeacherForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={isPending} error={error} />
      </Modal>

      <Modal open={!!successPassword} onClose={() => setSuccessPassword(null)} title={tc('success')}>
        <div className="space-y-6 p-4 text-center anim-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner-bevel">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-on-surface">{t('invite')} {tc('success')}</h3>
            <p className="text-sm text-outline font-medium">{t('tempPasswordDesc') || 'Please copy this temporary password for the user:'}</p>
          </div>
          <div className="p-6 bg-surface-container-low rounded-2xl border border-primary/20 font-mono text-2xl font-black text-primary tracking-[0.2em] shadow-lg shadow-primary/5 select-all group cursor-pointer relative overflow-hidden" title="Click to select">
            {successPassword}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <button onClick={() => setSuccessPassword(null)} className="h-12 w-full bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {tc('done')}
          </button>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t('edit')}>
        {editTarget && (
          <TeacherForm defaultValues={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={isPending} error={error} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete')}
        description={ts('deleteConfirmDesc', { name: `${deleteTarget?.first_name} ${deleteTarget?.last_name}` })}
        loading={isPending}
      />
    </div>
  )
}

type TeacherFormProps = {
  defaultValues?: Partial<Teacher>
  onSubmit: (formData: FormData) => void | Promise<void>
  onCancel: () => void
  loading: boolean
  error: string
}

function TeacherForm({ defaultValues, onSubmit, onCancel, loading }: TeacherFormProps) {
  const t = useTranslations('teachers')
  const tc = useTranslations('common')
  const ts = useTranslations('students')

  return (
    <form action={onSubmit} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{ts('firstName')} *</label>
          <input name="first_name" className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.first_name} placeholder={t('firstNamePlaceholder')} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{ts('lastName')} *</label>
          <input name="last_name" className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.last_name} placeholder={t('lastNamePlaceholder')} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{ts('email')} *</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
          <input name="email" type="email" className="w-full h-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.email ?? undefined} placeholder={t('emailPlaceholder')} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{ts('phone')}</label>
        <div className="relative group">
           <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">call</span>
           <input name="phone" className="w-full h-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" defaultValue={defaultValues?.phone ?? undefined} placeholder={t('phonePlaceholder')} />
        </div>
      </div>
      <div className="flex gap-4 justify-end pt-6">
        <button type="button" onClick={onCancel} className="h-12 px-6 rounded-2xl text-sm font-bold text-outline hover:bg-surface-container-high transition-all" disabled={loading}>{tc('cancel')}</button>
        <button type="submit" className="h-12 px-8 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2" disabled={loading}>
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? tc('loading') : (defaultValues ? tc('save') : t('invite'))}
        </button>
      </div>
    </form>
  )
}
