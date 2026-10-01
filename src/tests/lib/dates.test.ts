import { describe, expect, it } from 'vitest';

import { addWeeks, getMondayOf, parseIsoDate, toLocalIsoDate } from '../../lib/dates';
import { weekStartDateSchema } from '../../lib/schemas/mealPlan';

describe('dates helpers (#165)', () => {
	it('formats with local components, not UTC', () => {
		// Local midnight — toISOString() would shift this to the previous day east of UTC.
		expect(toLocalIsoDate(new Date(2026, 9, 5))).toBe('2026-10-05');
	});

	it('parses real calendar dates only', () => {
		expect(parseIsoDate('2026-10-05')?.getDate()).toBe(5);
		expect(parseIsoDate('2026-02-30')).toBeNull();
		expect(parseIsoDate('2026-1-5')).toBeNull();
		expect(parseIsoDate('nope')).toBeNull();
	});

	it.each([
		[new Date(2026, 9, 5), '2026-10-05'], // Monday
		[new Date(2026, 9, 7, 23, 59), '2026-10-05'], // Wednesday late
		[new Date(2026, 9, 11), '2026-10-05'], // Sunday
		[new Date(2026, 0, 1), '2025-12-29'] // across a year boundary
	])('getMondayOf(%s) → %s', (date, expected) => {
		expect(getMondayOf(date)).toBe(expected);
	});

	it('addWeeks moves Monday to Monday across month, year and DST boundaries', () => {
		expect(addWeeks('2026-09-28', 1)).toBe('2026-10-05');
		expect(addWeeks('2026-10-05', -1)).toBe('2026-09-28');
		expect(addWeeks('2025-12-29', 1)).toBe('2026-01-05');
		expect(addWeeks('2026-10-26', 1)).toBe('2026-11-02'); // US DST ends Nov 1
		expect(addWeeks('2026-03-02', 1)).toBe('2026-03-09'); // US DST starts Mar 8
	});

	it('weekStartDateSchema accepts only real Mondays', () => {
		expect(weekStartDateSchema.safeParse('2026-10-05').success).toBe(true);
		expect(weekStartDateSchema.safeParse('2026-10-04').success).toBe(false);
		expect(weekStartDateSchema.safeParse('2026-02-30').success).toBe(false);
		expect(weekStartDateSchema.safeParse('garbage').success).toBe(false);
	});
});
