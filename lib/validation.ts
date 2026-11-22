import { z } from 'zod';

// Status type
export const reminderStatusSchema = z.enum(['menunggu', 'terjadwal', 'terkirim', 'gagal']);
export type ReminderStatus = z.infer<typeof reminderStatusSchema>;

export const recurrenceSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'days']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

// ISO 8601 date string with timezone (must have offset or Z)
const isoDateSchema = z.string().refine((val) => {
  // Must be a valid ISO 8601 date with timezone offset or Z
  const isoWithTimezoneRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoWithTimezoneRegex.test(val)) {
    return false;
  }
  const date = new Date(val);
  return !isNaN(date.getTime());
}, 'Tanggal harus dalam format ISO 8601 dengan zona waktu (contoh: 2024-12-31T17:00:00Z atau 2024-12-31T17:00:00+07:00)');

// Deadline harus di masa depan
const deadlineSchema = isoDateSchema.refine((val) => {
  const date = new Date(val);
  return date.getTime() > Date.now();
}, 'Deadline harus di masa depan');

export const createReminderSchema = z.object({
  documentNumber: z.string().trim().min(1, 'Nomor dokumen wajib diisi').max(100, 'Nomor dokumen maksimal 100 karakter'),
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200, 'Judul maksimal 200 karakter'),
  vendorName: z.string().trim().min(1, 'Nama vendor wajib diisi').max(200, 'Nama vendor maksimal 200 karakter'),
  vendorEmail: z.string().trim().email('Format email tidak valid'),
  deadline: deadlineSchema,
  message: z.string().trim().max(2000, 'Pesan maksimal 2000 karakter').optional(),
  sendMode: z.enum(['immediate', 'scheduled']),
  scheduledAt: isoDateSchema.optional(),
  recurrence: recurrenceSchema.optional(),
}).refine((data) => {
  if (data.sendMode === 'scheduled' && !data.scheduledAt) {
    return false;
  }
  return true;
}, {
  message: 'Waktu terjadwal wajib diisi untuk mode terjadwal',
  path: ['scheduledAt'],
}).refine((data) => {
  if (data.sendMode === 'scheduled' && data.scheduledAt) {
    const scheduledDate = new Date(data.scheduledAt);
    const deadlineDate = new Date(data.deadline);
    return scheduledDate.getTime() < deadlineDate.getTime();
  }
  return true;
}, {
  message: 'Waktu terjadwal harus sebelum deadline',
  path: ['scheduledAt'],
}).refine((data) => {
  if (data.recurrence?.type === 'days' && (!data.recurrence.daysOfWeek || data.recurrence.daysOfWeek.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Pilih minimal satu hari untuk pengulangan hari tertentu',
  path: ['recurrence', 'daysOfWeek'],
});

export const testEmailSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100, 'Pencarian maksimal 100 karakter').optional(),
  status: reminderStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type RecurrenceInput = z.infer<typeof recurrenceSchema>;
