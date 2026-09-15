import type { RequestEvent } from '@sveltejs/kit';
import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';
import type { Rate, RateLimiterPlugin } from 'sveltekit-rate-limiter/server';
import { message } from 'sveltekit-superforms';
import type { SuperValidated } from 'sveltekit-superforms';

// Single shared module for both flavors of rate limiting: IP/IPUA-keyed for the
// auth form actions below, and user-id-keyed (via `createUserRateLimiter`) for
// the per-user AI-quota endpoints.

type MessageOptions = NonNullable<Parameters<typeof message>[2]>;

/**
 * One limiter per auth action (call this once per route, at module scope), so a
 * burst on one action never locks out another. `IPUA` mirrors the 5-req/min figure
 * already used by better-auth's own `rateLimit` config in `./auth/index.ts` for a
 * single browser identity; `IP` is a looser net that also catches distributed
 * attempts from behind a shared/NAT IP without tripping on a single legitimate user.
 */
export function createAuthRateLimiter(): RetryAfterRateLimiter {
	return new RetryAfterRateLimiter({
		IP: [15, 'm'],
		IPUA: [5, 'm']
	});
}

/** The 429 response for a rate-limited auth action, in the same shape as `invalidAuthForm`. */
export function rateLimitedMessage<TForm extends Record<string, unknown>>(
	form: SuperValidated<TForm>,
	retryAfterSeconds: number
) {
	return message(
		form,
		{
			type: 'error',
			text: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`
		},
		{ status: 429 as MessageOptions['status'] }
	);
}

class UserIdRateLimiter implements RateLimiterPlugin<{ userId: string }> {
	readonly rate: Rate | Rate[];

	constructor(rate: Rate | Rate[]) {
		this.rate = rate;
	}

	hash(_: RequestEvent, extraData: { userId: string }) {
		return extraData.userId;
	}
}

/**
 * One limiter per API route (call this once per route, at module scope), keyed by
 * `user.id` for per-user AI-quota throttling.
 */
export function createUserRateLimiter(
	rate: Rate | Rate[]
): RetryAfterRateLimiter<{ userId: string }> {
	return new RetryAfterRateLimiter<{ userId: string }>({
		plugins: [new UserIdRateLimiter(rate)]
	});
}
