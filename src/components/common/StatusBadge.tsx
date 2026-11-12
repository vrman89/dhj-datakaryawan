import React from 'react';
import { VerificationStatus, EmployeeStatus, ActiveStatus } from '../../types';

interface StatusBadgeProps {
  status: VerificationStatus | EmployeeStatus | ActiveStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'Terverifikasi':
    case 'Aktif':
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;

    case 'Menunggu Verifikasi':
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500 animate-pulse';
      break;

    case 'Perlu Perbaikan':
      colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;

    case 'Tidak Aktif':
    case 'Nonaktif':
      colorStyles = 'bg-slate-100 text-slate-600 border-slate-300';
      dotColor = 'bg-slate-400';
      break;

    case 'Internal':
    case 'Tetap':
      colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;

    case 'Subcont':
    case 'Kontrak':
    case 'Outsourcing':
      colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;

    default:
      colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
  }

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${sizeStyles} ${colorStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
