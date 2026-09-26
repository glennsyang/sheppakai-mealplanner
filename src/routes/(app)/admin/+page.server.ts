import { randomBytes } from 'node:crypto';

import { BETTER_AUTH_BASE_URL } from '$app/env/private';
import { FORGOT_PASSWORD_ROUTE } from '$lib/auth-routes';
import {
	banUserSchema,
	createUserSchema,
	removeUserSchema,
	sendWelcomeSchema,
	setRoleSchema,
	unbanUserSchema
} from '$lib/schemas/admin';
import { requireAdmin } from '$lib/server/actions/auth-guard';
import { allowedEmails, auth } from '$lib/server/auth';
import { sendAccountCreatedEmail } from '$lib/server/email';
import { logger } from '$lib/server/logger';
import { sendAuthAlerts } from '$lib/server/notifications';
import { error, fail, isRedirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

/**
 * Turn a failed `auth.api.*` admin call into an action result. better-auth raises
 * `APIError` for expected rejections (insufficient permission, target not found,
 * "can't ban an admin", …) — surface those with their real status/message and log
 * at `warn`. Anything else is unexpected: log at `error` and return a generic 500.
 * SvelteKit redirects are re-thrown untouched.
 */
function adminActionError(context: string, err: unknown, fallback: string) {
	if (isRedirect(err)) throw err;
	if (err instanceof APIError) {
		logger.warn(context, { status: err.statusCode, reason: err.message });
		return fail(err.statusCode || 400, { error: err.body?.message || fallback });
	}
	logger.error(context, err);
	return fail(500, { error: fallback });
}

const isAllowlisted = (email: string) => allowedEmails.has(email.trim().toLowerCase());

/** Sends the #138 welcome email with links built from the app's canonical origin. */
function sendWelcome(email: string, name: string) {
	const origin = new URL(BETTER_AUTH_BASE_URL).origin;
	return sendAccountCreatedEmail(email, name, {
		appUrl: origin,
		forgotPasswordUrl: new URL(FORGOT_PASSWORD_ROUTE, origin).href,
		profileUrl: new URL('/profile', origin).href
	});
}

export const load: PageServerLoad = async ({ request }) => {
	const createForm = await superValidate(zod4(createUserSchema));
	try {
		const { users } = await auth.api.listUsers({
			query: { limit: 500, sortBy: 'createdAt', sortDirection: 'desc' },
			headers: request.headers
		});
		const allowlistedIds = users.filter((u) => isAllowlisted(u.email)).map((u) => u.id);
		// The current allowlist lets the "not allowlisted" warning print the exact
		// `fly secrets set` command. Only read after better-auth's own admin check
		// (listUsers) passes, so it never rides along on a non-admin's data response.
		const allowlist = [...allowedEmails];
		return { users, allowlistedIds, allowlist, createForm };
	} catch (err) {
		// The session's cookie cache can briefly keep `role: 'admin'` after a demotion,
		// letting the layout guard pass; the plugin's own DB check here is authoritative.
		if (err instanceof APIError && (err.statusCode === 401 || err.statusCode === 403)) {
			error(403, 'Forbidden');
		}
		logger.error('Failed to load admin user list', err);
		return { users: [], allowlistedIds: [], allowlist: [] as string[], createForm };
	}
};

export const actions: Actions = {
	setRole: requireAdmin(async ({ request }, actingUser) => {
		const parsed = setRoleSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid role change request' });
		}
		const { userId, role } = parsed.data;

		if (userId === actingUser.id) {
			return fail(400, { error: 'You cannot change your own role' });
		}

		try {
			await auth.api.setRole({ body: { userId, role }, headers: request.headers });
			logger.info('Admin changed user role', { actorId: actingUser.id, userId, role });
		} catch (err) {
			return adminActionError('Failed to change user role', err, 'Failed to change user role');
		}
	}),

	banUser: requireAdmin(async ({ request }, actingUser) => {
		const parsed = banUserSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid ban request' });
		}
		const { userId, banReason } = parsed.data;

		if (userId === actingUser.id) {
			return fail(400, { error: 'You cannot ban yourself' });
		}

		try {
			await auth.api.banUser({
				body: { userId, ...(banReason ? { banReason } : {}) },
				headers: request.headers
			});
			logger.info('Admin banned user', { actorId: actingUser.id, userId });
		} catch (err) {
			return adminActionError('Failed to ban user', err, 'Failed to ban user');
		}
	}),

	unbanUser: requireAdmin(async ({ request }, actingUser) => {
		const parsed = unbanUserSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid unban request' });
		}

		try {
			await auth.api.unbanUser({ body: { userId: parsed.data.userId }, headers: request.headers });
			logger.info('Admin unbanned user', { actorId: actingUser.id, userId: parsed.data.userId });
		} catch (err) {
			return adminActionError('Failed to unban user', err, 'Failed to unban user');
		}
	}),

	removeUser: requireAdmin(async ({ request }, actingUser) => {
		const parsed = removeUserSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid remove request' });
		}

		if (parsed.data.userId === actingUser.id) {
			return fail(400, { error: 'You cannot remove your own account' });
		}

		try {
			await auth.api.removeUser({ body: { userId: parsed.data.userId }, headers: request.headers });
			logger.info('Admin removed user', { actorId: actingUser.id, userId: parsed.data.userId });
		} catch (err) {
			return adminActionError('Failed to remove user', err, 'Failed to remove user');
		}
	}),

	createUser: requireAdmin(async ({ request }, actingUser) => {
		const form = await superValidate(request, zod4(createUserSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { name, email, role } = form.data;

		let userId: string;
		try {
			// Random throwaway password nobody ever sees; the user sets their own via
			// the forgot-password flow described in the welcome email.
			const { user } = await auth.api.createUser({
				body: {
					name,
					email,
					role,
					password: randomBytes(32).toString('base64url')
				},
				headers: request.headers
			});
			userId = user.id;
		} catch (err) {
			if (isRedirect(err)) throw err;
			if (err instanceof APIError) {
				logger.warn('Failed to create user', {
					status: err.statusCode,
					reason: err.message
				});
				return setError(form, 'email', err.body?.message || 'Failed to create user', {
					status: err.statusCode === 403 ? 403 : 400
				});
			}
			logger.error('Failed to create user', err);
			return message(form, { type: 'error', text: 'Failed to create user' }, { status: 500 });
		}

		const allowlisted = isAllowlisted(email);
		let emailSent = false;
		if (allowlisted) {
			try {
				await sendWelcome(email, name);
				emailSent = true;
			} catch (err) {
				// Already logged by sendAccountCreatedEmail; the account exists either way.
				logger.warn('User created but welcome email failed', {
					userId,
					cause: String(err)
				});
			}
		}

		logger.info('Admin created user', {
			actorId: actingUser.id,
			userId,
			role,
			allowlisted,
			emailSent
		});
		await sendAuthAlerts(
			`Admin ${actingUser.email} created user ${email} (role: ${role})`,
			'Meal Planner - Admin Alert',
			3
		);

		if (!allowlisted) {
			return message(form, {
				type: 'warning',
				text: `Created ${email}, but it isn't in ALLOWED_EMAILS so they can't sign in yet. No welcome email was sent — add the email to the allowlist, then use "Send welcome email" on their row.`
			});
		}
		return message(
			form,
			emailSent
				? {
						type: 'success',
						text: `Created ${email} and sent them a welcome email.`
					}
				: {
						type: 'warning',
						text: `Created ${email}, but the welcome email failed to send. Use "Send welcome email" on their row to retry.`
					}
		);
	}),

	sendWelcomeEmail: requireAdmin(async ({ request }, actingUser) => {
		const parsed = sendWelcomeSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: 'Invalid request' });
		}

		try {
			const user = await auth.api.getUser({
				query: { id: parsed.data.userId },
				headers: request.headers
			});
			if (!isAllowlisted(user.email)) {
				return fail(400, {
					error: `${user.email} isn't in ALLOWED_EMAILS yet — add it before sending the welcome email.`
				});
			}
			await sendWelcome(user.email, user.name);
			logger.info('Admin sent welcome email', {
				actorId: actingUser.id,
				userId: user.id
			});
			return { success: `Welcome email sent to ${user.email}.` };
		} catch (err) {
			return adminActionError('Failed to send welcome email', err, 'Failed to send welcome email');
		}
	})
};
