import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';

import { createUserRateLimiter } from '../../lib/server/rate-limiter';

const fakeEvent = {} as RequestEvent;

describe('createUserRateLimiter', () => {
	it('allows requests up to the max within the window', async () => {
		const limiter = createUserRateLimiter([3, 's']);
		const userId = crypto.randomUUID();
		for (let i = 0; i < 3; i++) {
			const status = await limiter.check(fakeEvent, { userId });
			expect(status.limited).toBe(false);
		}
	});

	it('rejects requests beyond the max within the window', async () => {
		const limiter = createUserRateLimiter([3, 's']);
		const userId = crypto.randomUUID();
		for (let i = 0; i < 3; i++) {
			await limiter.check(fakeEvent, { userId });
		}
		const status = await limiter.check(fakeEvent, { userId });
		expect(status.limited).toBe(true);
	});

	it('tracks separate userIds independently', async () => {
		const limiter = createUserRateLimiter([1, 's']);
		const userA = crypto.randomUUID();
		const userB = crypto.randomUUID();
		await limiter.check(fakeEvent, { userId: userA });
		const statusA = await limiter.check(fakeEvent, { userId: userA });
		const statusB = await limiter.check(fakeEvent, { userId: userB });
		expect(statusA.limited).toBe(true);
		expect(statusB.limited).toBe(false);
	});
});
