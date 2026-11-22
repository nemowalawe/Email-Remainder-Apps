import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db';
import { Reminder } from '../../lib/models/Reminder';
import { createReminderSchema, searchQuerySchema } from '../../lib/validation';
import { sendReminderEmail } from '../../lib/mailer';
import { calculateNextRunAt } from '../../lib/schedule';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }
}

/**
 * Escape special regex characters to prevent ReDoS/regex injection
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const query = searchQuerySchema.parse(req.query);
    const { q, status, page, limit } = query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    // Search query with regex escaping (case-insensitive substring search)
    if (q) {
      const escapedQuery = escapeRegExp(q);
      const searchRegex = new RegExp(escapedQuery, 'i');
      filter.$or = [
        { documentNumber: searchRegex },
        { title: searchRegex },
        { vendorName: searchRegex },
        { vendorEmail: searchRegex },
      ];
    }

    // Execute queries
    const [data, total] = await Promise.all([
      Reminder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Reminder.countDocuments(filter),
    ]);

    return res.status(200).json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    
    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({
        error: 'Validasi gagal',
        details: (error as any).issues,
      });
    }
    
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const body = createReminderSchema.parse(req.body);

    const deadline = new Date(body.deadline);
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;

    // Create reminder object
    const reminderData: Record<string, unknown> = {
      documentNumber: body.documentNumber,
      title: body.title,
      vendorName: body.vendorName,
      vendorEmail: body.vendorEmail,
      deadline,
      message: body.message,
      sendMode: body.sendMode,
      recurrence: body.recurrence || { type: 'none' },
    };

    // Handle immediate send
    if (body.sendMode === 'immediate') {
      const reminder = new Reminder({
        ...reminderData,
        status: 'menunggu',
      });

      await reminder.save();

      // Send email immediately
      const result = await sendReminderEmail(reminder);

      if (result.success) {
        reminder.status = 'terkirim';
        reminder.lastSentAt = new Date();
        reminder.sentCount = 1;
      } else {
        reminder.status = 'gagal';
        reminder.errorMessage = result.error;
      }

      await reminder.save();

      return res.status(201).json({
        data: reminder,
        message: result.success ? 'Email berhasil dikirim' : 'Gagal mengirim email',
        emailResult: result,
      });
    }

    // Handle scheduled send
    if (!scheduledAt) {
      return res.status(400).json({ error: 'Waktu terjadwal wajib diisi' });
    }

    const recurrence = body.recurrence || { type: 'none' as const };
    const nextRunAt = calculateNextRunAt(scheduledAt, recurrence, deadline);

    if (!nextRunAt) {
      return res.status(400).json({ error: 'Tidak dapat menjadwalkan reminder' });
    }

    const reminder = new Reminder({
      ...reminderData,
      scheduledAt,
      nextRunAt,
      status: 'terjadwal',
    });

    await reminder.save();

    return res.status(201).json({
      data: reminder,
      message: 'Reminder berhasil dijadwalkan',
    });
  } catch (error) {
    console.error('Error creating reminder:', error);

    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({
        error: 'Validasi gagal',
        details: (error as any).issues,
      });
    }

    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
