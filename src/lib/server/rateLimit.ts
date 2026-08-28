interface RateLimitEntry {
	count: number;
	resetAt: number;
}

interface RateLimitOptions {
	windowMs: number;
	max: number;
}

const buckets = new Map<string, RateLimitEntry>();

/** Fixed-window rate limiter. Returns true if the request is allowed under `key`. */
export function checkRateLimit(key: string, { windowMs, max }: RateLimitOptions): boolean {
	const now = Date.now();
	const entry = buckets.get(key);

	if (!entry || now >= entry.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= max) {
		return false;
	}

	entry.count += 1;
	return true;
}
