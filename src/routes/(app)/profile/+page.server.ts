import { changePasswordSchema, updateNameSchema } from '$lib/schemas/auth';
import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { getUser, requireAuth } from '$lib/server/actions/auth-guard';
import { auth } from '$lib/server/auth';
import { sendPasswordChangedEmail } from '$lib/server/email';
import { logger } from '$lib/server/logger';
import { createUserRateLimiter, rateLimitedMessage } from '$lib/server/rate-limiter';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

// Keyed by user id (not IP) — this is an authenticated action, and the current-password
// check is the thing worth rate limiting against brute-forcing.
const changePasswordLimiter = createUserRateLimiter([5, 'm']);

/** Same header priority as `advanced.ipAddress.ipAddressHeaders` in `$lib/server/auth`. */
function getClientIp(request: Request): string | undefined {
	return (
		request.headers.get('fly-client-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		request.headers.get('x-client-ip') ||
		undefined
	);
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = getUser(locals);

	const nameForm = await superValidate({ name: user.name }, zod4(updateNameSchema));
	const passwordForm = await superValidate(zod4(changePasswordSchema));

	return { user, nameForm, passwordForm };
};

export const actions: Actions = {
	updateName: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateNameSchema));
		if (!form.valid) {
			return invalidAuthForm(form);
		}

		return handleAuthFormAction(
			form,
			async () => {
				await auth.api.updateUser({
					body: { name: form.data.name },
					headers: request.headers
				});

				logger.info('Profile name updated', { userId: user.id });
				return message(form, { type: 'success', text: 'Name updated.' });
			},
			{
				loggerContext: 'Profile name update failed',
				fallbackMessage: 'Failed to update name. Please try again.'
			}
		);
	}),

	changePassword: requireAuth(async (event, user) => {
		const { request } = event;
		const form = await superValidate(request, zod4(changePasswordSchema));
		if (!form.valid) {
			return invalidAuthForm(form);
		}

		const rateLimitStatus = await changePasswordLimiter.check(event, { userId: user.id });
		if (rateLimitStatus.limited) {
			return rateLimitedMessage(form, rateLimitStatus.retryAfter);
		}

		return handleAuthFormAction(
			form,
			async () => {
				const ipAddress = getClientIp(request);
				const userAgent = request.headers.get('user-agent') || undefined;

				await auth.api.changePassword({
					body: {
						currentPassword: form.data.currentPassword,
						newPassword: form.data.newPassword,
						revokeOtherSessions: true
					},
					headers: request.headers
				});

				logger.info('Security event: password changed and other sessions revoked', {
					userId: user.id,
					ipAddress,
					userAgent
				});

				void sendPasswordChangedEmail({
					to: user.email,
					name: user.name || user.email,
					changedAt: new Date(),
					ipAddress,
					userAgent,
					source: 'Profile settings'
				}).catch((err) => logger.error('Password changed email failed', err));

				return message(form, { type: 'success', text: 'Password changed successfully.' });
			},
			{
				loggerContext: 'Password change failed',
				fallbackMessage: 'Current password is incorrect or password change failed.'
			}
		);
	})
};
