import mongoose, { Document, Schema } from 'mongoose';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'days';

export interface IRecurrence {
  type: RecurrenceType;
  daysOfWeek?: number[];
  time?: string;
}

export type ReminderStatus = 'menunggu' | 'terjadwal' | 'terkirim' | 'gagal' | 'memproses';

export interface IReminder extends Document {
  documentNumber: string;
  title: string;
  vendorName: string;
  vendorEmail: string;
  deadline: Date;
  message?: string;
  sendMode: 'immediate' | 'scheduled';
  scheduledAt?: Date;
  recurrence: IRecurrence;
  nextRunAt?: Date;
  status: ReminderStatus;
  lastSentAt?: Date;
  sentCount: number;
  errorMessage?: string;
  lockedAt?: Date; // For atomic claim
  createdAt: Date;
  updatedAt: Date;
}

const RecurrenceSchema = new Schema<IRecurrence>(
  {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'days'],
      default: 'none',
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function (v: number[]) {
          return v.every((day) => day >= 0 && day <= 6);
        },
        message: 'daysOfWeek harus berisi angka 0-6 (Minggu-Sabtu)',
      },
    },
    time: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminder>(
  {
    documentNumber: {
      type: String,
      required: [true, 'Nomor dokumen wajib diisi'],
      trim: true,
      maxlength: [100, 'Nomor dokumen maksimal 100 karakter'],
    },
    title: {
      type: String,
      required: [true, 'Judul wajib diisi'],
      trim: true,
      maxlength: [200, 'Judul maksimal 200 karakter'],
    },
    vendorName: {
      type: String,
      required: [true, 'Nama vendor wajib diisi'],
      trim: true,
      maxlength: [200, 'Nama vendor maksimal 200 karakter'],
    },
    vendorEmail: {
      type: String,
      required: [true, 'Email vendor wajib diisi'],
      trim: true,
      lowercase: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline wajib diisi'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, 'Pesan maksimal 2000 karakter'],
    },
    sendMode: {
      type: String,
      enum: ['immediate', 'scheduled'],
      required: true,
    },
    scheduledAt: {
      type: Date,
    },
    recurrence: {
      type: RecurrenceSchema,
      default: () => ({ type: 'none' }),
    },
    nextRunAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['menunggu', 'terjadwal', 'terkirim', 'gagal', 'memproses'],
      default: 'menunggu',
    },
    lastSentAt: {
      type: Date,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
    },
    lockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for cron queries (includes lockedAt for recovery)
ReminderSchema.index({ status: 1, nextRunAt: 1 });

// Index for documentNumber (for search)
ReminderSchema.index({ documentNumber: 1 });

// Index for recovery of stuck reminders
ReminderSchema.index({ status: 1, lockedAt: 1 });

export const Reminder = mongoose.models.Reminder || mongoose.model<IReminder>('Reminder', ReminderSchema);
