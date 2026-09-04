import { resendVerificationSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (session) throw redirect(302, '/');

	const email = url.searchParams.get('email');
	if (!email) {
		throw redirect(302, '/login');
	}

	const verificationForm = await superValidate({ email }, zod4(resendVerificationSchema), {
		errors: false
	});

	return { email, verificationForm };
};

export const actions: Actions = {
	resend: async ({ request }) => {
		const form = await superValidate(request, zod4(resendVerificationSchema));
		if (!form.valid) {
			return message(form, 'Please enter a valid email address.', { status: 400 });
		}

		try {
			// Route through Better Auth's HTTP handler, rather than calling its API
			// method directly, so the configured per-IP rate limit protects this
			// public resend action too. The endpoint itself returns a generic response
			// for unknown and already-verified addresses to prevent account enumeration.
			const headers = new Headers(request.headers);
			headers.set('content-type', 'application/json');
			headers.delete('content-length');

			const response = await auth.handler(
				new Request(new URL('/api/auth/send-verification-email', request.url), {
					method: 'POST',
					headers,
					body: JSON.stringify({ email: form.data.email })
				})
			);
			if (!response.ok) {
				throw new Error(`Verification email request failed with status ${response.status}`);
			}
		} catch (error) {
			logger.error('Failed to resend verification email', error, { email: form.data.email });
			return message(form, 'We could not send a verification email. Please try again shortly.', {
				status: 500
			});
		}

		return message(
			form,
			'If an unverified account exists, a fresh verification link is on its way.'
		);
	}
};
