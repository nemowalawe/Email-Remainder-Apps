import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db.js';
import { Reminder } from '../../lib/models/Reminder.js';
import { sendReminderEmail } from '../../lib/mailer.js';
import { calculateNextRecurringRun } from '../../lib/schedule.js';

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_REMINDERS_PER_RUN = 20;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret with constant-time comparison
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!CRON_SECRET || !token || !constantTimeCompare(token, CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  await connectDB();

  try {
    const now = new Date();

    // Step 1: Recovery - unlock reminders stuck for more than 5 minutes
    const recoveryResult = await Reminder.updateMany(
      {
        status: 'memproses',
        lockedAt: { $lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) },
      },
      {
        $set: {
          status: 'terjadwal',
          lockedAt: null,
        },
      }
    );

    if (recoveryResult.modifiedCount > 0) {
      console.log(`Recovered ${recoveryResult.modifiedCount} stuck reminders`);
    }

    // Step 2: Find and claim reminders that are due
    const dueReminders = await Reminder.find({
      status: 'terjadwal',
      nextRunAt: { $lte: now },
    })
      .limit(MAX_REMINDERS_PER_RUN)
      .lean();

    console.log(`Found ${dueReminders.length} reminders to process`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      recovered: recoveryResult.modifiedCount,
    };

    for (const reminder of dueReminders) {
      results.processed++;

      // Atomic claim: set status to 'memproses' and lock
      const claimed = await Reminder.findOneAndUpdate(
        {
          _id: reminder._id,
          status: 'terjadwal',
        },
        {
          $set: {
            status: 'memproses',
            lockedAt: now,
          },
        },
        { new: true }
      );

      if (!claimed) {
        // Already claimed by another process
        results.skipped++;
        continue;
      }

      // Send email
      const result = await sendReminderEmail(claimed);

      if (result.success) {
        // Calculate next run if recurring
        const nextRun = calculateNextRecurringRun(
          claimed.nextRunAt!,
          claimed.recurrence,
          claimed.deadline
        );

        if (nextRun && claimed.recurrence.type !== 'none') {
          // Update for next occurrence
          await Reminder.findByIdAndUpdate(claimed._id, {
            $set: {
              status: 'terjadwal',
              nextRunAt: nextRun,
              lastSentAt: now,
              errorMessage: undefined,
              lockedAt: null,
            },
            $inc: { sentCount: 1 },
          });
        } else {
          // Mark as sent (no more occurrences)
          await Reminder.findByIdAndUpdate(claimed._id, {
            $set: {
              status: 'terkirim',
              lastSentAt: now,
              errorMessage: undefined,
              lockedAt: null,
            },
            $inc: { sentCount: 1 },
          });
        }

        results.sent++;
      } else {
        // Mark as failed
        await Reminder.findByIdAndUpdate(claimed._id, {
          $set: {
            status: 'gagal',
            errorMessage: result.error,
            lockedAt: null,
          },
        });

        results.failed++;
      }
    }

    const response = {
      success: true,
      timestamp: now.toISOString(),
      ...results,
    };

    console.log('Cron dispatch result:', response);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Cron dispatch error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
