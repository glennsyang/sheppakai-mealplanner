import { RESET_PASSWORD_ROUTE } from '$lib/auth-routes';
import { forgotPasswordSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

// Deliberately ambiguous: never confirm or deny that an address has an account.
const GENERIC_RESULT = 'If an account exists for that email, a password reset link is on its way.';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);
	const form = await createAuthLoadForm(forgotPasswordSchema, url);
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));
		if (!form.valid) {
			return invalidAuthForm(form, 'Please enter a valid email address.');
		}

		return handleAuthFormAction(
			form,
			async () => {
				// Route through Better Auth's HTTP handler, rather than calling
				// auth.api.requestPasswordReset directly, so the configured per-IP rate
				// limit protects this public, email-sending action too (a direct api call
				// bypasses the rate-limit middleware). Mirrors the verify-email resend
				// action. `redirectTo` is a relative path, which passes Better Auth's
				// origin check and lands the user on /reset-password?token=... after the
				// emailed link is verified.
				const headers = new Headers(request.headers);
				headers.set('content-type', 'application/json');
				headers.delete('content-length');

				const response = await auth.handler(
					new Request(new URL('/api/auth/request-password-reset', request.url), {
						method: 'POST',
						headers,
						body: JSON.stringify({ email: form.data.email, redirectTo: RESET_PASSWORD_ROUTE })
					})
				);
				if (!response.ok) {
					throw new Error(`Password reset request failed with status ${response.status}`);
				}

				// Never reveal whether the address has an account — identical text *and*
				// styling on the success and failure paths (see `errorType` below).
				return message(form, { type: 'success', text: GENERIC_RESULT });
			},
			{
				loggerContext: 'Failed to send password reset email',
				fallbackMessage: GENERIC_RESULT,
				errorType: 'success'
			}
		);
	}
};
