interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

const variants = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-700',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
