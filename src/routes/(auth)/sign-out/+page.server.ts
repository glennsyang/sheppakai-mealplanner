import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { isRedirect, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			await auth.api.signOut({
				headers: request.headers
			});
		} catch (err) {
			if (isRedirect(err)) throw err;
			// Still land on sign-in rather than a generic 500; the (app) guard re-checks the session.
			logger.warn('Sign-out failed', { reason: err instanceof Error ? err.message : String(err) });
		}

		throw redirect(302, SIGN_IN_ROUTE);
	}
} satisfies Actions;
