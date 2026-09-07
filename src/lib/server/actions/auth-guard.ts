import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';

type AuthedUser = NonNullable<App.Locals['user']>;

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated before executing the action handler.
 *
 * @example
 * export const actions = {
 *   create: requireAuth(async (event, user) => {
 *     // user is guaranteed to be defined here
 *   })
 * };
 */
export function requireAuth<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: AuthedUser) => Promise<T>
): (event: RequestEvent<Params>) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent<Params>) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		return handler(event, event.locals.user);
	};
}

/**
 * Returns the authenticated user from locals, or throws a redirect to /login.
 * Use in load functions inside the (app) route group where the layout already
 * guarantees authentication — this gives a type-narrowed user without non-null
 * assertions.
 */
export function getUser(locals: App.Locals): AuthedUser {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	return locals.user;
}

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated and has the 'admin' role before executing
 * the action handler.
 *
 * @example
 * export const actions = {
 *   banUser: requireAdmin(async (event, admin) => {
 *     // admin is guaranteed to be an authenticated user with role 'admin'
 *   })
 * };
 */
export function requireAdmin<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: AuthedUser) => Promise<T>
): (event: RequestEvent<Params>) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent<Params>) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		if (event.locals.user.role !== 'admin') {
			return fail(403, { error: 'Forbidden' });
		}
		return handler(event, event.locals.user);
	};
}
