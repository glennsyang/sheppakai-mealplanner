import { POST_LOGIN_ROUTE, VERIFY_EMAIL_ROUTE } from '$lib/auth-routes';
import { loginSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);

	const form = await createAuthLoadForm(loginSchema, url);
	// Whitelisted flag only — the reset-password action redirects here with
	// ?reset=success so we can confirm the change. No query text is reflected.
	const resetComplete = url.searchParams.get('reset') === 'success';
	return { form, resetComplete };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) {
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				try {
					await auth.api.signInEmail({
						body: {
							email: form.data.email,
							password: form.data.password
						},
						headers: request.headers
					});
				} catch (error) {
					// An unverified account can't sign in, but better-auth
					// (emailVerification.sendOnSignIn) has just re-sent a fresh
					// verification link. Send the user to the page that explains that,
					// instead of surfacing a dead-end "email not verified" form error.
					if (error instanceof APIError && error.body?.code === 'EMAIL_NOT_VERIFIED') {
						throw redirect(
							302,
							`${VERIFY_EMAIL_ROUTE}?email=${encodeURIComponent(form.data.email)}`
						);
					}
					throw error;
				}

				throw redirect(302, POST_LOGIN_ROUTE);
			},
			{
				loggerContext: 'Login failed',
				fallbackMessage: 'Invalid email or password'
			}
		);
	}
};
