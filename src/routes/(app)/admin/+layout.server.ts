import { getUser } from '$lib/server/actions/auth-guard';
import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = getUser(locals);

	if (user.role !== 'admin') {
		error(403, 'Forbidden');
	}

	return { user };
};
