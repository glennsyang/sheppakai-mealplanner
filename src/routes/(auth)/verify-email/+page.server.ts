import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) throw redirect(302, '/');

	const email = url.searchParams.get('email');
	if (!email) {
		throw redirect(302, '/login');
	}

	return { email };
};
