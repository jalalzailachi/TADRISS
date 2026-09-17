'use client'

import { Modal } from './Modal'
import { useTranslations } from 'next-intl'

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel,
  loading = false, variant = 'danger'
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}) {
  const tc = useTranslations('common')
  const resolvedConfirmLabel = confirmLabel || tc('delete')

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center space-y-6 pt-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-error-container/40' : 'bg-secondary-container/20'}`}>
          <span className={`material-symbols-outlined text-3xl ${variant === 'danger' ? 'text-error' : 'text-secondary'}`}>
            {variant === 'danger' ? 'delete_forever' : 'warning'}
          </span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">{title}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-[320px]">
            {description}
          </p>
        </div>

        <div className="flex gap-4 w-full pt-4">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-outline hover:bg-surface-container-high transition-all"
          >
            {tc('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${variant === 'danger' ? 'bg-error shadow-error/20 hover:bg-error/90' : 'bg-primary shadow-primary/20 hover:bg-primary/90'}`}
          >
            {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {resolvedConfirmLabel}
          </button>
        </div>

        <div className="pt-6 mt-4 border-t border-outline-variant/10 w-full flex justify-center">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-outline opacity-40">
              {tc('securedBy')}
           </p>
        </div>
      </div>
    </Modal>
  )
}
