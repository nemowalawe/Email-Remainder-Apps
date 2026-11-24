import { describe, it, expect } from 'vitest';
import { DateTime, Settings } from 'luxon';
import { calculateNextRunAt, calculateNextRecurringRun } from './schedule';
import { IRecurrence } from './models/Reminder';

// Set timezone and fixed system time for deterministic tests
Settings.defaultZone = 'Asia/Jakarta';
Settings.now = () => new Date('2024-12-14T00:00:00.000Z').getTime();

describe('calculateNextRunAt', () => {
  const createRecurrence = (type: IRecurrence['type'], daysOfWeek?: number[], time?: string): IRecurrence => ({
    type,
    daysOfWeek,
    time,
  });

  describe('non-recurring', () => {
    it('should return scheduledAt for non-recurring reminders', () => {
      const scheduledAt = new Date('2024-12-15T09:00:00Z');
      const deadline = new Date('2024-12-20T17:00:00Z');
      const recurrence = createRecurrence('none');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).toEqual(scheduledAt);
    });

    it('should return null if scheduledAt is after deadline', () => {
      const scheduledAt = new Date('2024-12-25T09:00:00Z');
      const deadline = new Date('2024-12-20T17:00:00Z');
      const recurrence = createRecurrence('none');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).toBeNull();
    });
  });

  describe('daily recurrence', () => {
    it('should calculate next daily run from scheduled time', () => {
      // Scheduled at 09:00 UTC on Dec 15, deadline Dec 20
      const scheduledAt = new Date('2024-12-15T02:00:00Z'); // 09:00 WIB
      const deadline = new Date('2024-12-20T10:00:00Z'); // 17:00 WIB
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      // Should be 09:00 WIB on Dec 15
      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.hour).toBe(9);
      expect(resultDt.minute).toBe(0);
    });

    it('should move to next day if time has passed today', () => {
      // Use a fixed "now" by scheduling in the past
      const scheduledAt = new Date('2024-12-10T02:00:00Z'); // 09:00 WIB, in the past
      const deadline = new Date('2030-12-20T10:00:00Z'); // Far future
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      // Should be tomorrow at 09:00 WIB since scheduled time has passed
      expect(resultDt.hour).toBe(9);
      expect(resultDt.minute).toBe(0);
    });

    it('should stop after deadline', () => {
      const scheduledAt = new Date('2024-12-15T02:00:00Z');
      const deadline = new Date('2024-12-14T17:00:00Z'); // Before scheduled
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).toBeNull();
    });
  });

  describe('weekly recurrence', () => {
    it('should add 7 days for weekly recurrence', () => {
      const scheduledAt = new Date('2024-12-15T02:00:00Z'); // Sunday 09:00 WIB
      const deadline = new Date('2024-12-30T10:00:00Z');
      const recurrence = createRecurrence('weekly', undefined, '09:00');

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      // Should be 7 days later
      expect(resultDt.day).toBe(22); // Dec 22
      expect(resultDt.hour).toBe(9);
    });
  });

  describe('days recurrence', () => {
    it('should find next matching day', () => {
      // Schedule on Monday (Dec 16, 2024), look for Wednesday (day 3)
      const scheduledAt = new Date('2024-12-16T02:00:00Z'); // Monday 09:00 WIB
      const deadline = new Date('2024-12-25T10:00:00Z');
      const recurrence = createRecurrence('days', [3], '09:00'); // Wednesday

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      // Should be Wednesday Dec 18
      expect(resultDt.weekday).toBe(3); // Wednesday in Luxon
    });

    it('should wrap to next week if no matching day this week', () => {
      // Schedule on Friday (Dec 20, 2024), look for Monday (day 1)
      const scheduledAt = new Date('2024-12-20T02:00:00Z'); // Friday 09:00 WIB
      const deadline = new Date('2024-12-30T10:00:00Z');
      const recurrence = createRecurrence('days', [1], '09:00'); // Monday

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      // Should be Monday Dec 23
      expect(resultDt.weekday).toBe(1); // Monday in Luxon
      expect(resultDt.day).toBe(23);
    });

    it('should handle multiple days', () => {
      const scheduledAt = new Date('2024-12-16T02:00:00Z'); // Monday 09:00 WIB
      const deadline = new Date('2024-12-25T10:00:00Z');
      const recurrence = createRecurrence('days', [3, 5], '09:00'); // Wednesday, Friday

      const result = calculateNextRunAt(scheduledAt, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      // Should be Wednesday (the first matching day after Monday)
      expect(resultDt.weekday).toBe(3);
    });
  });
});

describe('calculateNextRecurringRun', () => {
  const createRecurrence = (type: IRecurrence['type'], daysOfWeek?: number[], time?: string): IRecurrence => ({
    type,
    daysOfWeek,
    time,
  });

  describe('daily recurrence', () => {
    it('should add 1 day for daily recurrence', () => {
      const lastRun = new Date('2024-12-15T02:00:00Z'); // 09:00 WIB
      const deadline = new Date('2024-12-20T10:00:00Z');
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.day).toBe(16); // Next day
      expect(resultDt.hour).toBe(9);
    });

    it('should stop after deadline', () => {
      const lastRun = new Date('2024-12-18T02:00:00Z');
      const deadline = new Date('2024-12-19T00:00:00Z'); // Before next run
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).toBeNull();
    });
  });

  describe('weekly recurrence', () => {
    it('should add 7 days for weekly recurrence', () => {
      const lastRun = new Date('2024-12-15T02:00:00Z'); // Sunday
      const deadline = new Date('2024-12-30T10:00:00Z');
      const recurrence = createRecurrence('weekly', undefined, '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.day).toBe(22); // Next Sunday
    });
  });

  describe('days recurrence', () => {
    it('should find next consecutive day (e.g. Monday to Tuesday)', () => {
      // Last run on Monday (Dec 16), next should be Tuesday (Dec 17)
      const lastRun = new Date('2024-12-16T02:00:00Z'); // Monday 09:00 WIB
      const deadline = new Date('2024-12-25T10:00:00Z');
      const recurrence = createRecurrence('days', [1, 2, 3], '09:00'); // Mon, Tue, Wed

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.weekday).toBe(2); // Tuesday
      expect(resultDt.day).toBe(17);
    });

    it('should find next day in the same week', () => {
      // Last run on Monday (Dec 16), next should be Wednesday (Dec 18)
      const lastRun = new Date('2024-12-16T02:00:00Z'); // Monday 09:00 WIB
      const deadline = new Date('2024-12-25T10:00:00Z');
      const recurrence = createRecurrence('days', [1, 3], '09:00'); // Monday, Wednesday

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.weekday).toBe(3); // Wednesday
      expect(resultDt.day).toBe(18);
    });

    it('should wrap to next week if needed', () => {
      // Last run on Friday (Dec 20), next should be Monday (Dec 23)
      const lastRun = new Date('2024-12-20T02:00:00Z'); // Friday 09:00 WIB
      const deadline = new Date('2024-12-30T10:00:00Z');
      const recurrence = createRecurrence('days', [1, 5], '09:00'); // Monday, Friday

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.weekday).toBe(1); // Monday
      expect(resultDt.day).toBe(23);
    });

    it('should stop if next run is after deadline', () => {
      const lastRun = new Date('2024-12-18T02:00:00Z'); // Wednesday
      const deadline = new Date('2024-12-20T00:00:00Z'); // Before Friday
      const recurrence = createRecurrence('days', [1, 3, 5], '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).toBeNull();
    });
  });

  describe('cross-month scenarios', () => {
    it('should handle end of month correctly', () => {
      // Last run on Dec 30, deadline Jan 5
      const lastRun = new Date('2024-12-30T02:00:00Z');
      const deadline = new Date('2025-01-05T17:00:00Z');
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.day).toBe(31);
      expect(resultDt.month).toBe(12);
    });

    it('should handle month boundary', () => {
      // Last run on Dec 31, deadline Jan 5
      const lastRun = new Date('2024-12-31T02:00:00Z');
      const deadline = new Date('2025-01-05T17:00:00Z');
      const recurrence = createRecurrence('daily', undefined, '09:00');

      const result = calculateNextRecurringRun(lastRun, recurrence, deadline);

      expect(result).not.toBeNull();
      const resultDt = DateTime.fromJSDate(result!).setZone('Asia/Jakarta');
      expect(resultDt.day).toBe(1);
      expect(resultDt.month).toBe(1);
      expect(resultDt.year).toBe(2025);
    });
  });
});
