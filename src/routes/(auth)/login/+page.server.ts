import { loginSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { isRedirect, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) throw redirect(302, '/');

	const form = await superValidate(zod4(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) {
			return message(
				form,
				{ type: 'error', text: 'Please correct the errors in the form.' },
				{ status: 400 }
			);
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: form.data.email,
					password: form.data.password
				},
				headers: request.headers
			});
		} catch (error) {
			// Don't catch redirects as errors - re-throw them
			if (isRedirect(error)) {
				throw error;
			}
			if (error instanceof APIError && error.body?.code === 'EMAIL_NOT_VERIFIED') {
				throw redirect(302, `/verify-email?email=${encodeURIComponent(form.data.email)}`);
			}
			logger.warn('Login failed', { email: form.data.email, error });
			return message(form, 'Invalid email or password', { status: 400 });
		}

		throw redirect(302, '/');
	}
};
