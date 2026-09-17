'use client';

import type { LucideIcon } from 'lucide-react';

interface Trend {
  value: number;
  label: string;
}

interface StatsCardProps {
  icon?: LucideIcon;
  iconName?: string;
  label: string;
  value: string | number;
  trend?: Trend;
  loading?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const accentBg: Record<NonNullable<StatsCardProps['accent']>, string> = {
  primary: 'bg-primary-container/15 text-primary',
  success: 'bg-success-soft text-on-success-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-error-soft text-on-error-soft',
  info: 'bg-info-soft text-on-info-soft',
};

export function StatsCard({
  icon: Icon,
  iconName,
  label,
  value,
  trend,
  loading,
  accent = 'primary',
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="card-premium p-6">
        <div className="skeleton h-3 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-4" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const trendPositive = trend && trend.value >= 0;

  return (
    <div className="card-premium p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        {(Icon || iconName) && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentBg[accent]}`}
          >
            {Icon ? (
              <Icon className="h-5 w-5" strokeWidth={2} />
            ) : (
              <span className="material-symbols-outlined text-[20px]">
                {iconName}
              </span>
            )}
          </div>
        )}
      </div>

      <p className="font-headline text-3xl font-bold tracking-tight text-on-surface font-mono">
        {value}
      </p>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${
              trendPositive
                ? 'bg-success-soft text-on-success-soft'
                : 'bg-error-soft text-on-error-soft'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {trendPositive ? 'trending_up' : 'trending_down'}
            </span>
            {trendPositive ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-on-surface-variant">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
