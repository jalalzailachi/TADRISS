import Link from 'next/link'

export function PageHeader({ title, subtitle, label, action, backHref, count }: {
  title: string; subtitle?: string; label?: string; action?: React.ReactNode; backHref?: string; count?: string
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 animate-in fade-in slide-in-from-top-1">
      <div className="space-y-1 min-w-0">
        {label && (
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block opacity-80">
            {label}
          </span>
        )}
        <div className="flex items-center gap-4">
          {backHref && (
            <Link 
              href={backHref} 
              className="w-10 h-10 rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm text-outline hover:text-on-surface hover:border-outline-variant/30 flex items-center justify-center transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
          )}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface uppercase truncate">
            {title}
          </h2>
          {count && (
            <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-black text-on-surface-variant uppercase tracking-widest border border-outline-variant/10">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.15em] opacity-70">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 mb-1">{action}</div>}
    </header>
  )
}
