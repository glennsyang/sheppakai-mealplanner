import { suggestFromPantrySchema } from '$lib/schemas/pantry';
import { suggestMeals } from '$lib/server/ai/gemini';
import { logger } from '$lib/server/logger';
import { createUserRateLimiter } from '$lib/server/rate-limiter';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const limiter = createUserRateLimiter([10, 'm']);

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const rateLimitStatus = await limiter.check(event, { userId: locals.user.id });
	if (rateLimitStatus.limited) {
		error(429, `Too many requests. Please try again in ${rateLimitStatus.retryAfter} seconds.`);
	}

	const body = await request.json().catch(() => null);
	const parsed = suggestFromPantrySchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? 'Invalid request');
	}

	const { items } = parsed.data;

	logger.info('Suggest API called', { userId: locals.user.id, itemCount: items.length });

	try {
		const suggestions = await suggestMeals(items);
		return json(suggestions);
	} catch (err) {
		logger.error('Suggest API error', { err });
		error(500, 'Failed to generate suggestions');
	}
};
