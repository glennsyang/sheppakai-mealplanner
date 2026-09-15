import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import { resendVerificationSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { auth } from '$lib/server/auth';
import { redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { createAuthRateLimiter, rateLimitedMessage } from '$lib/server/rate-limiter';
import { redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

const GENERIC_RESEND_RESULT =
	'If an unverified account exists, a fresh verification link is on its way.';

const limiter = createAuthRateLimiter();

export const load: PageServerLoad = async ({ locals, url }) => {
	redirectIfAuthenticated(locals.user);

	const email = url.searchParams.get('email');
	// Whitelisted flag only — the sign-in page renders a fixed banner for
	// ?verify=invalid; no message text is reflected through the URL.
	if (!email) {
		throw redirect(302, `${SIGN_IN_ROUTE}?verify=invalid`);
	}

	const verificationForm = await superValidate({ email }, zod4(resendVerificationSchema), {
		errors: false
	});

	return { email, verificationForm };
};

export const actions: Actions = {
	resend: async (event) => {
		const { request } = event;
		const form = await superValidate(request, zod4(resendVerificationSchema));
		if (!form.valid) {
			return invalidAuthForm(form, 'Please enter a valid email address.');
		}

		const rateLimitStatus = await limiter.check(event);
		if (rateLimitStatus.limited) {
			return rateLimitedMessage(form, rateLimitStatus.retryAfter);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.sendVerificationEmail({
					body: { email: form.data.email },
					headers: request.headers
				});

				return message(form, { type: 'success', text: GENERIC_RESEND_RESULT });
			},
			{
				loggerContext: 'Failed to resend verification email',
				fallbackMessage: 'We could not send a verification email. Please try again shortly.'
			}
		);
	}
};
