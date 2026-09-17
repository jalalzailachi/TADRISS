'use client'
import { useEffect, useRef } from 'react'

export function Modal({
  open, onClose, title, children, size = 'md'
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: '400px', md: '480px', lg: '640px' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        ref={ref}
        className="relative w-full anim-modal overflow-hidden bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl"
        style={{ maxWidth: widths[size] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6 border-b border-outline-variant/10">
          <h2 className="text-lg sm:text-xl font-headline font-black tracking-tight text-on-surface">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 sm:px-8 sm:py-8 text-on-surface-variant max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
