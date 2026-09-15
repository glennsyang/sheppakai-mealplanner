import { VERIFY_EMAIL_ROUTE } from '$lib/auth-routes';
import { registerSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { createAuthRateLimiter, rateLimitedMessage } from '$lib/server/rate-limiter';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const limiter = createAuthRateLimiter();

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(registerSchema, url);
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { request } = event;
		const form = await superValidate(request, zod4(registerSchema));
		if (!form.valid) {
			return invalidAuthForm(form);
		}

		const rateLimitStatus = await limiter.check(event);
		if (rateLimitStatus.limited) {
			return rateLimitedMessage(form, rateLimitStatus.retryAfter);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.signUpEmail({
					body: {
						name: form.data.name,
						email: form.data.email,
						password: form.data.password
					},
					headers: request.headers
				});

				throw redirect(302, `${VERIFY_EMAIL_ROUTE}?email=${encodeURIComponent(form.data.email)}`);
			},
			{
				loggerContext: 'Registration failed',
				fallbackMessage: 'Registration failed. That email may already be in use.'
			}
		);
	}
};
