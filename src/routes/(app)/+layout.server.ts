import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(302, SIGN_IN_ROUTE);
	}

	return {
		user: session.user
	};
};
