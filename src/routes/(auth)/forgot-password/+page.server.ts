import { forgotPasswordSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

// Deliberately ambiguous: never confirm or deny that an address has an account.
const GENERIC_RESULT = 'If an account exists for that email, a password reset link is on its way.';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) throw redirect(302, '/');

	const form = await superValidate(zod4(forgotPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));
		if (!form.valid) {
			return message(form, 'Please enter a valid email address.', { status: 400 });
		}

		try {
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
					body: JSON.stringify({ email: form.data.email, redirectTo: '/reset-password' })
				})
			);
			if (!response.ok) {
				throw new Error(`Password reset request failed with status ${response.status}`);
			}
		} catch (error) {
			logger.error('Failed to send password reset email', error, { email: form.data.email });
			return message(form, GENERIC_RESULT, { status: 500 });
		}

		return message(form, GENERIC_RESULT);
	}
};
