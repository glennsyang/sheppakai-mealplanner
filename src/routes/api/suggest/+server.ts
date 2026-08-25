import { logger } from '$lib/server/logger';
import { suggestMeals } from '$lib/server/ai/gemini';
import { auth } from '$lib/server/auth';
import { json, error } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		error(401, 'Unauthorized');
	}

	const items = url.searchParams.getAll('items').filter((s) => s.trim().length > 0);
	if (items.length === 0) {
		error(400, 'At least one pantry item is required');
	}

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
