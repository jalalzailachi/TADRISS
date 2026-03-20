interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

export function StatsCard({
  label,
  value,
  icon,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 ${iconBg} rounded-lg ${iconColor}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-bold flex items-center gap-0.5 ${
              trend.positive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {trend.positive ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
}
