import { suggestFromPantrySchema } from '$lib/schemas/pantry';
import { suggestMeals } from '$lib/server/ai/gemini';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { checkRateLimit } from '$lib/server/rateLimit';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const RATE_LIMIT = { windowMs: 60_000, max: 10 };

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		error(401, 'Unauthorized');
	}

	if (!checkRateLimit(`suggest:${session.user.id}`, RATE_LIMIT)) {
		error(429, 'Too many requests. Please try again later.');
	}

	const body = await request.json().catch(() => null);
	const parsed = suggestFromPantrySchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? 'Invalid request');
	}

	const { items } = parsed.data;

	logger.info('Suggest API called', { userId: session.user.id, itemCount: items.length });

	try {
		const suggestions = await suggestMeals(items);
		return json(suggestions);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to generate suggestions';
		logger.error('Suggest API error', { err });
		error(500, message);
	}
};
