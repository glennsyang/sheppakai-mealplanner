import { suggestVariations } from '$lib/server/ai/claude';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Unauthorized');

	const meal = url.searchParams.get('meal')?.trim();
	if (!meal) error(400, 'meal query parameter is required');

	try {
		const variations = await suggestVariations(meal);
		return json(variations);
	} catch (err) {
		logger.error('Variations API error', { err });
		error(500, 'Failed to generate variations');
	}
};
