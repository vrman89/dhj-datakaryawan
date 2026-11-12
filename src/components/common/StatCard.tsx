import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'indigo' | 'amber' | 'rose' | 'emerald';
  badgeText?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badgeText,
  onClick,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-white',
      border: 'border-slate-200/80 hover:border-blue-400',
      iconBg: 'bg-blue-50 text-blue-600',
      accent: 'text-blue-700',
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-slate-200/80 hover:border-indigo-400',
      iconBg: 'bg-indigo-50 text-indigo-600',
      accent: 'text-indigo-700',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-slate-200/80 hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-600',
      accent: 'text-amber-700',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-slate-200/80 hover:border-rose-400',
      iconBg: 'bg-rose-50 text-rose-600',
      accent: 'text-rose-700',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-slate-200/80 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accent: 'text-emerald-700',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border shadow-xs transition-all duration-200 ${variantStyles.bg} ${variantStyles.border} ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-slate-500">
          <span className={`font-semibold mr-1.5 ${variantStyles.accent}`}>{badgeText}</span>
        </div>
      )}
    </div>
  );
};
