import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit } from '../../lib/server/rateLimit';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('checkRateLimit', () => {
	it('allows requests up to the max within the window', () => {
		const key = `test:${crypto.randomUUID()}`;
		for (let i = 0; i < 3; i++) {
			expect(checkRateLimit(key, { windowMs: 1000, max: 3 })).toBe(true);
		}
	});

	it('rejects requests beyond the max within the window', () => {
		const key = `test:${crypto.randomUUID()}`;
		for (let i = 0; i < 3; i++) {
			checkRateLimit(key, { windowMs: 1000, max: 3 });
		}
		expect(checkRateLimit(key, { windowMs: 1000, max: 3 })).toBe(false);
	});

	it('resets the count after the window elapses', () => {
		const key = `test:${crypto.randomUUID()}`;
		for (let i = 0; i < 3; i++) {
			checkRateLimit(key, { windowMs: 1000, max: 3 });
		}
		expect(checkRateLimit(key, { windowMs: 1000, max: 3 })).toBe(false);

		vi.advanceTimersByTime(1001);

		expect(checkRateLimit(key, { windowMs: 1000, max: 3 })).toBe(true);
	});

	it('tracks separate keys independently', () => {
		const keyA = `test:${crypto.randomUUID()}`;
		const keyB = `test:${crypto.randomUUID()}`;
		checkRateLimit(keyA, { windowMs: 1000, max: 1 });
		expect(checkRateLimit(keyA, { windowMs: 1000, max: 1 })).toBe(false);
		expect(checkRateLimit(keyB, { windowMs: 1000, max: 1 })).toBe(true);
	});
});
