import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { container: string; dot: string; dotPulse: string }> = {
  success: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    dotPulse: 'bg-emerald-400',
  },
  warning: {
    container: 'bg-amber-50 text-amber-900 border-amber-200',
    dot: 'bg-amber-600',
    dotPulse: 'bg-amber-400',
  },
  danger: {
    container: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-600',
    dotPulse: 'bg-red-400',
  },
  info: {
    container: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    dotPulse: 'bg-blue-400',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-500',
    dotPulse: 'bg-slate-400',
  },
  accent: {
    container: 'bg-amber-100/70 text-amber-950 border-amber-300/80',
    dot: 'bg-amber-700',
    dotPulse: 'bg-amber-500',
  },
};

const SIZE_STYLES: Record<BadgeSize, { badge: string; icon: string; dot: string }> = {
  sm: {
    badge: 'text-[11px] px-2 py-0.5 gap-1',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * StatusBadge (Thẻ trạng thái chuẩn màu ngữ nghĩa WCAG 4.5:1).
 * Đảm bảo độ tương phản cao, dễ đọc trong môi trường bếp nhiều ánh sáng.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon: Icon,
  children,
  className = '',
}) => {
  const vStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const sStyle = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap select-none font-medium ${vStyle.container} ${sStyle.badge} ${className}`}
    >
      {dot && (
        <span className="relative flex shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${vStyle.dotPulse}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${sStyle.dot} ${vStyle.dot}`} />
        </span>
      )}
      {Icon && <Icon className={`shrink-0 ${sStyle.icon}`} />}
      <span>{children}</span>
    </span>
  );
};

export default StatusBadge;
