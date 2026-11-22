import React, { useState } from 'react';
import { Reminder } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import {
  CalendarIcon,
  ClockIcon,
  SendIcon,
  RepeatIcon,
  TrashIcon,
  FileTextIcon,
  EmptyInboxIcon,
  AlertCircleIcon,
} from './icons';

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Format date to Indonesian locale with WIB timezone
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return formatter.format(date) + ' WIB';
}

function getRecurrenceLabel(recurrence: Reminder['recurrence']): string | null {
  if (!recurrence || recurrence.type === 'none') return null;

  const time = recurrence.time || '09:00';

  switch (recurrence.type) {
    case 'daily':
      return `Setiap hari pukul ${time} WIB`;
    case 'weekly':
      return `Setiap minggu pukul ${time} WIB`;
    case 'days':
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const days = recurrence.daysOfWeek.map((d) => dayNames[d]).join(', ');
        return `Setiap ${days} (${time} WIB)`;
      }
      return null;
    default:
      return null;
  }
}

export const ReminderList: React.FC<ReminderListProps> = ({
  reminders,
  onDelete,
  isLoading,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reminder: Reminder) => {
    if (reminder.status === 'terkirim') {
      alert('Reminder yang sudah terkirim tidak dapat dihapus');
      return;
    }

    if (!confirm(`Hapus reminder dokumen "${reminder.documentNumber}"?`)) {
      return;
    }

    setDeletingId(reminder._id);
    try {
      await onDelete(reminder._id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4 animate-pulse">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                <div className="h-4 bg-zinc-800 rounded w-16"></div>
              </div>
              <div className="h-5 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-3.5 bg-zinc-800/60 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-white/[0.08] rounded-xl bg-zinc-950/40">
        <div className="flex justify-center text-zinc-600 mb-3">
          <EmptyInboxIcon size={40} />
        </div>
        <p className="text-zinc-300 font-medium text-sm">Belum ada reminder</p>
        <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
          Reminder yang Anda buat atau jadwalkan akan tercatat secara realtime di panel ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder._id}
          className="group relative bg-[#111215] border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-4 transition-all duration-150"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Header row: Doc Number + Status */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                  <FileTextIcon size={12} className="text-zinc-400" />
                  {reminder.documentNumber}
                </span>
                <StatusBadge status={reminder.status} />
              </div>

              {/* Title */}
              <h3 className="font-medium text-zinc-100 text-sm sm:text-base leading-snug line-clamp-1">
                {reminder.title}
              </h3>

              {/* Vendor meta */}
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 truncate">
                <span className="text-zinc-300 font-medium">{reminder.vendorName}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono text-[11px] truncate">{reminder.vendorEmail}</span>
              </p>
            </div>

            {/* Delete button (if not sent) */}
            {reminder.status !== 'terkirim' && (
              <button
                onClick={() => handleDelete(reminder)}
                disabled={deletingId === reminder._id}
                title="Hapus reminder"
                className="btn-press opacity-75 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-40"
              >
                <TrashIcon size={15} />
              </button>
            )}
          </div>

          {/* Timing details grid */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <CalendarIcon size={13} className="text-rose-400 flex-shrink-0" />
              <span>Deadline:</span>
              <span className="font-medium text-rose-300 tabular-nums">
                {formatDate(reminder.deadline)}
              </span>
            </div>

            {reminder.nextRunAt && reminder.status === 'terjadwal' && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ClockIcon size={13} className="text-blue-400 flex-shrink-0" />
                <span>Berikutnya:</span>
                <span className="font-medium text-blue-300 tabular-nums">
                  {formatDate(reminder.nextRunAt)}
                </span>
              </div>
            )}

            {reminder.sentCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <SendIcon size={13} className="text-emerald-400 flex-shrink-0" />
                <span>Terkirim:</span>
                <span className="font-medium text-zinc-200 tabular-nums">{reminder.sentCount}x</span>
              </div>
            )}

            {getRecurrenceLabel(reminder.recurrence) && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <RepeatIcon size={13} className="text-indigo-400 flex-shrink-0" />
                <span>Jadwal:</span>
                <span className="font-medium text-zinc-200">
                  {getRecurrenceLabel(reminder.recurrence)}
                </span>
              </div>
            )}
          </div>

          {/* Optional notes */}
          {reminder.message && (
            <div className="mt-2.5 p-2 bg-white/[0.03] border border-white/[0.06] rounded-md text-xs text-zinc-400 line-clamp-2">
              <span className="text-zinc-500 mr-1.5 font-medium">Catatan:</span>
              {reminder.message}
            </div>
          )}

          {/* Error notice */}
          {reminder.errorMessage && (
            <div className="mt-2.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-300 flex items-start gap-1.5">
              <AlertCircleIcon size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{reminder.errorMessage}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
