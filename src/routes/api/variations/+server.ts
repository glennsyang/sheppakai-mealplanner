import { suggestVariationsSchema } from '$lib/schemas/mealPlan';
import { suggestVariations } from '$lib/server/ai/claude';
import { logger } from '$lib/server/logger';
import { createUserRateLimiter } from '$lib/server/rate-limiter';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const limiter = createUserRateLimiter([10, 'm']);

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

	if (!locals.user) error(401, 'Unauthorized');

	const rateLimitStatus = await limiter.check(event, { userId: locals.user.id });
	if (rateLimitStatus.limited) {
		error(429, `Too many requests. Please try again in ${rateLimitStatus.retryAfter} seconds.`);
	}

	const body = await request.json().catch(() => null);
	const parsed = suggestVariationsSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? 'Invalid request');
	}

	try {
		const variations = await suggestVariations(parsed.data.meal);
		return json(variations);
	} catch (err) {
		logger.error('Variations API error', { err });
		error(500, 'Failed to generate variations');
	}
};
