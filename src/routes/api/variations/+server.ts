import { suggestVariationsSchema } from '$lib/schemas/mealPlan';
import { suggestVariations } from '$lib/server/ai/claude';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { checkRateLimit } from '$lib/server/rateLimit';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

const RATE_LIMIT = { windowMs: 60_000, max: 10 };

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Unauthorized');

	if (!checkRateLimit(`variations:${session.user.id}`, RATE_LIMIT)) {
		error(429, 'Too many requests. Please try again later.');
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
