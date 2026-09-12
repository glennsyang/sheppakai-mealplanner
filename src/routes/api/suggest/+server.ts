import { suggestFromPantrySchema } from '$lib/schemas/pantry';
import { suggestMeals } from '$lib/server/ai/gemini';
import { logger } from '$lib/server/logger';
import { checkRateLimit } from '$lib/server/rateLimit';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const RATE_LIMIT = { windowMs: 60_000, max: 10 };

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	if (!checkRateLimit(`suggest:${locals.user.id}`, RATE_LIMIT)) {
		error(429, 'Too many requests. Please try again later.');
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
