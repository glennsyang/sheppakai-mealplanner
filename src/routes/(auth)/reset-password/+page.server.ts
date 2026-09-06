import { resetPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { isRedirect, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) throw redirect(302, '/');

	const token = url.searchParams.get('token');
	// Better Auth's link verifier redirects here with `?error=INVALID_TOKEN` when
	// the emailed link is expired or malformed, and with `?token=...` when it's good.
	const invalid = !token || url.searchParams.has('error');

	const form = await superValidate({ token: token ?? undefined }, zod4(resetPasswordSchema), {
		errors: false
	});

	return { token, invalid, form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));
		if (!form.data.token) {
			return message(form, 'This reset link is invalid or has expired. Request a new one.', {
				status: 400
			});
		}
		if (!form.valid) {
			return message(form, 'Please correct the errors in the form.', { status: 400 });
		}

		try {
			await auth.api.resetPassword({
				body: {
					token: form.data.token,
					newPassword: form.data.password
				},
				headers: request.headers
			});
		} catch (error) {
			// Don't catch redirects as errors - re-throw them
			if (isRedirect(error)) {
				throw error;
			}
			logger.warn('Password reset failed', { error });
			return message(form, 'This reset link is invalid or has expired. Request a new one.', {
				status: 400
			});
		}

		throw redirect(302, '/login?reset=success');
	}
};
