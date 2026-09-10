import { SIGN_IN_ROUTE } from '$lib/auth-routes';
import type { RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';

/**
 * An authenticated user as populated on `event.locals` by `hooks.server.ts`.
 */
type AuthenticatedUser = NonNullable<App.Locals['user']>;

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated before executing the action handler.
 *
 * @example
 * export const actions = {
 *   create: requireAuth(async (event, user) => {
 *     // user is guaranteed to be defined here
 *     const userId = user.id;
 *     // ... rest of logic
 *   })
 * };
 */
export function requireAuth<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: AuthenticatedUser) => Promise<T>
): (event: RequestEvent<Params>) => Promise<T | ReturnType<typeof fail>> {
	return async (event: RequestEvent<Params>) => {
		if (!event.locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}
		return handler(event, event.locals.user);
	};
}

/**
 * Returns the authenticated user from locals, or throws a redirect to SIGN_IN_ROUTE.
 * Use in load functions inside the (app) route group where the layout already
 * guarantees authentication — this gives a type-narrowed user without non-null
 * assertions.
 *
 * @example
 * export const load: PageServerLoad = async ({ locals }) => {
 *   const user = getUser(locals);
 *   // user.id is typed as string, no ! required
 * };
 */
export function getUser(locals: App.Locals): AuthenticatedUser {
	if (!locals.user) {
		throw redirect(302, SIGN_IN_ROUTE);
	}
	return locals.user;
}

/**
 * Authorization wrapper for SvelteKit actions.
 * Ensures the user is authenticated and has the 'admin' role before executing
 * the action handler. Returns `fail(401)` when unauthenticated, `fail(403)` when
 * authenticated but not an admin.
 *
 * This is the canonical cross-repo admin guard — identical shape in synapse,
 * sheppakai-budget and sheppakai-mealplanner (sheppakai-budget#437). It checks
 * the DB `role` only.
 *
 * @example
 * export const actions = {
 *   restore: requireAdmin(async (event, user) => {
 *     // user is guaranteed to be an authenticated admin here
 *   })
 * };
 */
export function requireAdmin<
	T,
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>
>(
	handler: (event: RequestEvent<Params>, user: AuthenticatedUser) => Promise<T>
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
