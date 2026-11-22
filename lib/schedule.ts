import { DateTime, Settings } from 'luxon';
import type { IRecurrence } from './models/Reminder.js';

// Set default timezone
Settings.defaultZone = 'Asia/Jakarta';

const TIMEZONE = 'Asia/Jakarta';

/**
 * Format Date to Indonesian locale with Asia/Jakarta timezone
 */
export function formatDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    dateStyle: 'long',
    timeStyle: 'short',
  });
  return formatter.format(date) + ' WIB';
}

/**
 * Parse time string (HH:mm) to hours and minutes
 */
function parseTime(timeStr?: string): { hours: number; minutes: number } {
  if (!timeStr) {
    return { hours: 9, minutes: 0 }; // Default 09:00
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Get the next occurrence of a specific day of week in Asia/Jakarta timezone
 */
export function getNextDayOfWeek(current: DateTime, targetDay: number): DateTime {
  const currentDay = current.weekday % 7; // Luxon uses 1-7 (Mon-Sun), convert to 0-6 (Sun-Sat)
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  return current.plus({ days: daysUntilTarget });
}

/**
 * Calculate the next run time for a reminder
 * All times are interpreted in Asia/Jakarta timezone
 */
export function calculateNextRunAt(
  scheduledAt: Date,
  recurrence: IRecurrence,
  deadline: Date
): Date | null {
  const deadlineDt = DateTime.fromJSDate(deadline, { zone: TIMEZONE });
  
  // For non-recurring, just return the scheduled time
  if (recurrence.type === 'none') {
    const scheduledDt = DateTime.fromJSDate(scheduledAt, { zone: TIMEZONE });
    if (scheduledDt >= deadlineDt) {
      return null;
    }
    return scheduledAt;
  }

  const now = DateTime.now().setZone(TIMEZONE);
  const { hours, minutes } = parseTime(recurrence.time);

  // Start from scheduled time or now, whichever is later
  let nextRun = DateTime.fromJSDate(scheduledAt, { zone: TIMEZONE });
  
  // If scheduled time is in the past, start from now
  if (nextRun <= now) {
    nextRun = now;
  }

  switch (recurrence.type) {
    case 'daily': {
      // Set time for today
      nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      
      // If time has passed today, move to tomorrow
      if (nextRun <= now) {
        nextRun = nextRun.plus({ days: 1 });
      }
      
      break;
    }

    case 'weekly': {
      // Set time
      nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      
      // Add 7 days from scheduled date
      nextRun = nextRun.plus({ days: 7 });
      
      // If still in the past, keep adding weeks
      while (nextRun <= now) {
        nextRun = nextRun.plus({ days: 7 });
      }
      
      break;
    }

    case 'days': {
      if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
        return null;
      }

      // Sort days of week (0 = Sunday, 6 = Saturday)
      const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
      
      // Find the next matching day
      nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      
      // Find next matching day
      let found = false;
      let iterations = 0;
      const maxIterations = 7;

      while (!found && iterations < maxIterations) {
        for (const day of sortedDays) {
          const checkDay = nextRun.weekday % 7;
          if (checkDay === day && nextRun > now) {
            found = true;
            break;
          }
        }
        if (!found) {
          nextRun = nextRun.plus({ days: 1 });
          nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
        }
        iterations++;
      }

      break;
    }

    default:
      return null;
  }

  // Check if next run is after deadline
  if (nextRun >= deadlineDt) {
    return null;
  }

  return nextRun.toJSDate();
}

/**
 * Calculate the next recurring run after the last run
 */
export function calculateNextRecurringRun(
  lastRun: Date,
  recurrence: IRecurrence,
  deadline: Date
): Date | null {
  const deadlineDt = DateTime.fromJSDate(deadline, { zone: TIMEZONE });
  const { hours, minutes } = parseTime(recurrence.time);
  
  // Start from last run
  let nextRun = DateTime.fromJSDate(lastRun, { zone: TIMEZONE });
  nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  switch (recurrence.type) {
    case 'daily': {
      nextRun = nextRun.plus({ days: 1 });
      break;
    }

    case 'weekly': {
      nextRun = nextRun.plus({ days: 7 });
      break;
    }

    case 'days': {
      if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
        return null;
      }

      const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
      
      // Move to next day and find next matching day
      nextRun = nextRun.plus({ days: 1 });
      
      const currentDay = nextRun.weekday % 7; // 0-6 (Sun-Sat)
      
      // Find next matching day
      let nextDay = sortedDays.find((day) => day > currentDay);
      if (nextDay !== undefined) {
        // Same week
        const daysToAdd = nextDay - currentDay;
        nextRun = nextRun.plus({ days: daysToAdd });
      } else {
        // Next week, wrap to first day
        const firstDay = sortedDays[0];
        const daysToFirstDay = (7 - currentDay) + firstDay;
        nextRun = nextRun.plus({ days: daysToFirstDay });
      }

      nextRun = nextRun.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
      break;
    }

    default:
      return null;
  }

  // Check if next run is after deadline
  if (nextRun >= deadlineDt) {
    return null;
  }

  return nextRun.toJSDate();
}

/**
 * Convert a local datetime value (from datetime-local input) to UTC ISO string
 * The input is assumed to be in Asia/Jakarta timezone
 */
export function localToUTC(localDateTime: string): string {
  const dt = DateTime.fromISO(localDateTime, { zone: TIMEZONE });
  return dt.toUTC().toISO()!;
}

/**
 * Convert UTC Date to local ISO string for datetime-local input
 */
export function utcToLocal(utcDate: Date | string): string {
  const dt = typeof utcDate === 'string' 
    ? DateTime.fromISO(utcDate, { zone: 'UTC' })
    : DateTime.fromJSDate(utcDate, { zone: 'UTC' });
  
  const local = dt.setZone(TIMEZONE);
  return local.toFormat("yyyy-MM-dd'T'HH:mm");
}
