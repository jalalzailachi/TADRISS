'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { addStudent, updateStudent, deleteStudent } from './actions'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'

export type Student = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  created_at: string
  class_students: { class: { id: string; name: string } }[]
}

export function StudentsClient({ 
  initialStudents, 
  totalCount,
  currentPage,
  pageSize 
}: { 
  initialStudents: Student[],
  totalCount: number,
  currentPage: number,
  pageSize: number
}) {
  const t = useTranslations('students')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [error, setError] = useState('')
  const [successPassword, setSuccessPassword] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const currentQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(currentQuery)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (val) {
        params.set('q', val)
      } else {
        params.delete('q')
      }
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    }, 350)
  }, [searchParams, pathname, router])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleCreate(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await addStudent(formData)
      if (res && 'error' in res) { 
        setError(res.error as string); 
        return 
      }
      
      if (res && 'success' in res && res.success && res.password) {
        setSuccessPassword(res.password)
      }
      setShowCreate(false)
    })
  }

  async function handleUpdate(formData: FormData) {
    if (!editTarget) return
    setError('')
    startTransition(async () => {
      const res = await updateStudent(editTarget.id, formData)
      if (res?.error) { setError(res.error); return }
      setEditTarget(null)
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteStudent(deleteTarget.id)
      if (res?.error) { setError(res.error); return }
      setDeleteTarget(null)
    })
  }

  const columns = [
    {
      key: 'student',
      label: t('fullName'),
      render: (student: Student) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20 uppercase">
            {student.first_name?.[0]}{student.last_name?.[0]}
          </div>
          <div>
            <p className="text-sm font-black text-on-surface uppercase tracking-tight">
              {student.first_name} {student.last_name}
            </p>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest opacity-60">{t('joined')} {new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: t('contact'),
      render: (student: Student) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-outline opacity-50">mail</span>
            {student.email}
          </div>
          {student.phone && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-outline tracking-wider opacity-60">
              <span className="material-symbols-outlined text-[16px]">call</span>
              {student.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'enrollment',
      label: tc('enrollment'),
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-primary tabular-nums">{student.class_students?.length || 0}</span>
          <span className="text-[10px] font-black text-outline uppercase tracking-widest opacity-60">{t('classes')}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: tc('status'),
      render: () => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-black uppercase tracking-widest border border-tertiary/10">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          {tc('active')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '', // Empty label for actions
      render: (student: Student) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditTarget(student)} className="w-9 h-9 rounded-xl text-outline hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button onClick={() => setDeleteTarget(student)} className="w-9 h-9 rounded-xl text-outline hover:text-error hover:bg-error/5 flex items-center justify-center transition-all bg-surface-container-high/30 border border-outline-variant/10 shadow-sm">
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
        subtitle={t('subtitle', { count: totalCount })}
        count={totalCount.toString()}
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
              <span className="material-symbols-outlined text-[20px]">add</span>
              {t('add')}
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
          data={initialStudents}
          columns={columns}
          emptyState={
            <EmptyState
              icon="person_add"
              title={t('noStudents')}
              description={t('createDesc')}
              action={
                <button 
                  onClick={() => setShowCreate(true)} 
                  className="h-11 px-8 bg-on-surface text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-on-surface/10"
                >
                  {t('add')}
                </button>
              }
            />
          }
          itemsPerPage={pageSize}
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          onPageChange={handlePageChange}
          totalItems={totalCount}
        />
      </div>

      {/* CREATE/EDIT MODALS */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('add')}>
        <StudentForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={isPending} error={error} />
      </Modal>

      <Modal open={!!successPassword} onClose={() => setSuccessPassword(null)} title={tc('success')}>
        <div className="space-y-6 p-4 text-center anim-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner-bevel">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-on-surface">{t('add')} {tc('success')}</h3>
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
          <StudentForm defaultValues={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={isPending} error={error} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete')}
        description={t('deleteConfirmDesc', { name: `${deleteTarget?.first_name} ${deleteTarget?.last_name}` })}
        loading={isPending}
      />
    </div>
  )
}

interface StudentFormProps {
  defaultValues?: Partial<Student>;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}

function StudentForm({ defaultValues, onSubmit, onCancel, loading }: StudentFormProps) {
  const t = useTranslations('students')
  const tc = useTranslations('common')

  return (
    <form action={onSubmit} className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('firstName')} *</label>
          <input name="first_name" className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.first_name} placeholder={t('firstNamePlaceholder')} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('lastName')} *</label>
          <input name="last_name" className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.last_name} placeholder={t('lastNamePlaceholder')} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('email')} *</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
          <input name="email" type="email" className="w-full h-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" required defaultValue={defaultValues?.email ?? undefined} placeholder={t('emailPlaceholder')} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-widest ps-1">{t('phone')}</label>
        <div className="relative group">
           <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">call</span>
           <input name="phone" className="w-full h-12 ps-12 pe-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" defaultValue={defaultValues?.phone ?? undefined} placeholder={t('phonePlaceholder')} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-6">
        <button type="button" onClick={onCancel} className="h-12 px-6 rounded-2xl text-sm font-bold text-outline hover:bg-surface-container-high transition-all" disabled={loading}>{tc('cancel')}</button>
        <button type="submit" className="h-12 px-8 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2" disabled={loading}>
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? tc('loading') : (defaultValues ? tc('save') : t('add'))}
        </button>
      </div>
    </form>
  )
}
