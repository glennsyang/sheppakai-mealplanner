import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { resetPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Request a new one.';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);

	const token = url.searchParams.get('token');
	// Better Auth's link verifier redirects here with `?error=INVALID_TOKEN` when
	// the emailed link is expired or malformed, and with `?token=...` when it's good.
	const invalid = !token || url.searchParams.has('error');

	const form = await createAuthLoadForm(resetPasswordSchema, url, { includeQueryMessage: false });

	return { token, invalid, form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));
		if (!form.data.token) {
			return invalidAuthForm(form, INVALID_LINK_MESSAGE);
		}
		if (!form.valid) {
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.resetPassword({
					body: {
						token: form.data.token,
						newPassword: form.data.password
					}
				});

				throw redirect(302, `${SIGN_IN_ROUTE}?reset=success`);
			},
			{
				loggerContext: 'Password reset failed',
				fallbackMessage: INVALID_LINK_MESSAGE
			}
		);
	}
};
