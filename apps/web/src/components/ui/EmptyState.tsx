export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 w-64 h-64 rounded-full bg-primary/5 blur-[64px] -z-0" />

      {/* Icon container */}
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-6 shadow-sm border border-outline-variant/10 relative z-10">
        <span className="material-symbols-outlined text-[32px] text-outline opacity-60">
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="max-w-xs space-y-1.5 mb-8 relative z-10">
        <h3 className="text-lg font-black text-on-surface uppercase tracking-tight leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs font-bold text-outline uppercase tracking-widest leading-relaxed opacity-70">
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {action && <div className="relative z-10">{action}</div>}
    </div>
  )
}
