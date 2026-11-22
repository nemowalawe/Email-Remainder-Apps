import React from 'react';
import { ClockIcon, CalendarIcon, CheckCircleIcon, AlertCircleIcon } from './icons';

type Status = 'menunggu' | 'terjadwal' | 'terkirim' | 'gagal';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<
  Status,
  { label: string; dotClass: string; badgeClass: string; icon: React.ReactNode }
> = {
  menunggu: {
    label: 'Menunggu',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    icon: <ClockIcon size={12} className="text-amber-400" />,
  },
  terjadwal: {
    label: 'Terjadwal',
    dotClass: 'bg-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    icon: <CalendarIcon size={12} className="text-blue-400" />,
  },
  terkirim: {
    label: 'Terkirim',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: <CheckCircleIcon size={12} className="text-emerald-400" />,
  },
  gagal: {
    label: 'Gagal',
    dotClass: 'bg-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    icon: <AlertCircleIcon size={12} className="text-rose-400" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.menunggu;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
};
