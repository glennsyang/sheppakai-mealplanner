import {
	banUserSchema,
	removeUserSchema,
	setRoleSchema,
	unbanUserSchema
} from '$lib/schemas/admin';
import { requireAdmin } from '$lib/server/actions/auth-guard';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { error, fail, isRedirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';

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

export const load: PageServerLoad = async ({ request }) => {
	try {
		const { users } = await auth.api.listUsers({
			query: { limit: 500, sortBy: 'createdAt', sortDirection: 'desc' },
			headers: request.headers
		});
		return { users };
	} catch (err) {
		// The session's cookie cache can briefly keep `role: 'admin'` after a demotion,
		// letting the layout guard pass; the plugin's own DB check here is authoritative.
		if (err instanceof APIError && (err.statusCode === 401 || err.statusCode === 403)) {
			error(403, 'Forbidden');
		}
		logger.error('Failed to load admin user list', err);
		return { users: [] };
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
	})
};
