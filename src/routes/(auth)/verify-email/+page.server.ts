import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { resendVerificationSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const GENERIC_RESEND_RESULT =
	'If an unverified account exists, a fresh verification link is on its way.';

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);

	const email = url.searchParams.get('email');
	if (!email) {
		throw redirect(302, SIGN_IN_ROUTE);
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
			return invalidAuthForm(form, 'Please enter a valid email address.');
		}

		return handleAuthFormAction(
			form,
			async () => {
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

				return message(form, { type: 'success', text: GENERIC_RESEND_RESULT });
			},
			{
				loggerContext: 'Failed to resend verification email',
				fallbackMessage: 'We could not send a verification email. Please try again shortly.'
			}
		);
	}
};
