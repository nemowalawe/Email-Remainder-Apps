import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateReminderInput } from '../lib/api';
import { CalendarIcon, SendIcon, RefreshIcon } from './icons';

const schema = z.object({
  documentNumber: z.string().min(1, 'Nomor dokumen wajib diisi').max(100),
  title: z.string().min(1, 'Judul pengadaan wajib diisi').max(200),
  vendorName: z.string().min(1, 'Nama vendor wajib diisi').max(200),
  vendorEmail: z.string().email('Format email tidak valid'),
  deadline: z.string().min(1, 'Deadline pengumpulan wajib diisi'),
  message: z.string().max(2000).optional(),
  sendMode: z.enum(['immediate', 'scheduled']),
  scheduledAt: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['none', 'daily', 'weekly', 'days']).optional(),
  daysOfWeek: z.array(z.number()).optional(),
  recurringTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ReminderFormProps {
  onSubmit: (data: CreateReminderInput) => Promise<void>;
  isLoading: boolean;
}

const dayOptions = [
  { value: 1, label: 'Sen' },
  { value: 2, label: 'Sel' },
  { value: 3, label: 'Rab' },
  { value: 4, label: 'Kam' },
  { value: 5, label: 'Jum' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Min' },
];

function getDefaultValues(): FormData {
  const now = new Date();
  const jakartaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const deadline = new Date(jakartaNow.getTime() + 7 * 24 * 60 * 60 * 1000);
  const scheduled = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);

  return {
    documentNumber: '',
    title: '',
    vendorName: '',
    vendorEmail: '',
    deadline: formatDateTimeLocal(deadline),
    message: '',
    sendMode: 'scheduled',
    scheduledAt: formatDateTimeLocal(scheduled),
    isRecurring: false,
    recurrenceType: 'none',
    daysOfWeek: [],
    recurringTime: '09:00',
  };
}

function formatDateTimeLocal(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function localToUTC(localDateTime: string): string {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const jakartaOffset = '+07:00';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${jakartaOffset}`;
}

export const ReminderForm: React.FC<ReminderFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  const sendMode = watch('sendMode');
  const isRecurring = watch('isRecurring');
  const recurrenceType = watch('recurrenceType');
  const daysOfWeek = watch('daysOfWeek') || [];

  const handleFormSubmit = async (data: FormData) => {
    const deadlineUTC = localToUTC(data.deadline);

    const input: CreateReminderInput = {
      documentNumber: data.documentNumber.trim(),
      title: data.title.trim(),
      vendorName: data.vendorName.trim(),
      vendorEmail: data.vendorEmail.trim().toLowerCase(),
      deadline: deadlineUTC,
      message: data.message?.trim(),
      sendMode: data.sendMode,
    };

    if (data.sendMode === 'scheduled' && data.scheduledAt) {
      input.scheduledAt = localToUTC(data.scheduledAt);

      if (data.isRecurring && data.recurrenceType && data.recurrenceType !== 'none') {
        input.recurrence = {
          type: data.recurrenceType,
          time: data.recurringTime || '09:00',
        };

        if (data.recurrenceType === 'days' && data.daysOfWeek && data.daysOfWeek.length > 0) {
          input.recurrence.daysOfWeek = data.daysOfWeek;
        }
      }
    }

    await onSubmit(input);
    reset(getDefaultValues());
    setValue('isRecurring', false);
    setValue('recurrenceType', 'none');
    setValue('daysOfWeek', []);
  };

  const toggleDay = (day: number) => {
    const current = daysOfWeek || [];
    if (current.includes(day)) {
      setValue(
        'daysOfWeek',
        current.filter((d) => d !== day)
      );
    } else {
      setValue('daysOfWeek', [...current, day]);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Row 1: Nomor Dokumen & Judul */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Nomor Dokumen <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            {...register('documentNumber')}
            className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="DOC-2026-001"
          />
          {errors.documentNumber && (
            <p className="mt-1 text-xs text-rose-400">{errors.documentNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Judul Pengadaan <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="Pengadaan Komponen Gardu"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Nama Vendor & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Nama Vendor <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            {...register('vendorName')}
            className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="PT. Mitra Daya Mandiri"
          />
          {errors.vendorName && (
            <p className="mt-1 text-xs text-rose-400">{errors.vendorName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Email Vendor <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            {...register('vendorEmail')}
            className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder="vendor@mitradaya.com"
          />
          {errors.vendorEmail && (
            <p className="mt-1 text-xs text-rose-400">{errors.vendorEmail.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Deadline & Mode Kirim */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Deadline Pengumpulan (WIB) <span className="text-rose-400">*</span>
          </label>
          <input
            type="datetime-local"
            {...register('deadline')}
            className="w-full px-3 py-2 text-sm tabular-nums bg-zinc-900/60 border border-white/[0.08] text-zinc-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {errors.deadline && (
            <p className="mt-1 text-xs text-rose-400">{errors.deadline.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Mode Pengiriman <span className="text-rose-400">*</span>
          </label>
          <select
            {...register('sendMode')}
            className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <option value="scheduled" className="bg-zinc-900 text-zinc-200">Jadwalkan Pengiriman</option>
            <option value="immediate" className="bg-zinc-900 text-zinc-200">Kirim Langsung Sekarang</option>
          </select>
        </div>
      </div>

      {/* Conditional: Jadwal Pengiriman */}
      {sendMode === 'scheduled' && (
        <div className="p-3.5 bg-zinc-950/60 border border-white/[0.06] rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Waktu Mulai Kirim (WIB) <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              {...register('scheduledAt')}
              className="w-full px-3 py-2 text-sm tabular-nums bg-zinc-900/60 border border-white/[0.08] text-zinc-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-xs text-rose-400">{errors.scheduledAt.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              {...register('isRecurring')}
              className="w-4 h-4 rounded bg-zinc-900 border-white/[0.15] text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRecurring" className="text-xs text-zinc-300 font-medium cursor-pointer select-none">
              Ulangi pengiriman secara berkala
            </label>
          </div>

          {isRecurring && (
            <div className="pt-2 border-t border-white/[0.06] space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Frekuensi Siklus
                </label>
                <select
                  {...register('recurrenceType')}
                  className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="none" className="bg-zinc-900">Tanpa Pengulangan</option>
                  <option value="daily" className="bg-zinc-900">Setiap Hari</option>
                  <option value="weekly" className="bg-zinc-900">Setiap Minggu</option>
                  <option value="days" className="bg-zinc-900">Hari Tertentu</option>
                </select>
              </div>

              {recurrenceType === 'days' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Pilih Hari Aktif
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayOptions.map((day) => {
                      const isSelected = daysOfWeek.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`btn-press px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border border-blue-500 font-semibold shadow-sm'
                              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.08]'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrenceType && recurrenceType !== 'none' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Pukul Eksekusi (WIB)
                  </label>
                  <input
                    type="time"
                    {...register('recurringTime')}
                    className="w-full px-3 py-2 text-sm tabular-nums bg-zinc-900/60 border border-white/[0.08] text-zinc-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Catatan / Pesan */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
          Catatan Tambahan untuk Vendor <span className="text-zinc-500 font-normal">(opsional)</span>
        </label>
        <textarea
          {...register('message')}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
          placeholder="Daftar berkas yang wajib dilampirkan: Dokumen Teknis, Penawaran Harga, Pakta Integritas."
        />
        {errors.message && (
          <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>
        )}
      </div>

      {/* Action buttons: 1-to-3 rule */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-press flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memproses...</span>
            </>
          ) : sendMode === 'immediate' ? (
            <>
              <SendIcon size={15} />
              <span>Kirim Email Sekarang</span>
            </>
          ) : (
            <>
              <CalendarIcon size={15} />
              <span>Simpan & Jadwalkan</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => reset(getDefaultValues())}
          title="Reset form"
          className="btn-press inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white rounded-lg transition-colors"
        >
          <RefreshIcon size={14} />
          <span>Reset</span>
        </button>
      </div>
    </form>
  );
};
