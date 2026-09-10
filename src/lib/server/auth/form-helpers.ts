// Shared auth-page `load` helpers. Canonical cross-repo module surface
// (auth-audit.md §2N, glennsyang/sheppakai-budget#438) — kept byte-identical with
// synapse and sheppakai-budget.

import { POST_LOGIN_ROUTE } from '$lib/auth-routes';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { ZodType } from 'zod';

interface CreateAuthLoadFormOptions {
	includeQueryMessage?: boolean;
	messageParam?: string;
}

type AuthSchema = ZodType<Record<string, unknown>>;

/**
 * Redirects an already-authenticated visitor away from an auth page (sign-in,
 * register, …) to the post-login destination. No-op when signed out.
 */
export function redirectIfAuthenticated(user: App.Locals['user']): void {
	if (user) {
		throw redirect(302, POST_LOGIN_ROUTE);
	}
}

/**
 * Builds the superforms object for an auth page `load`. When `includeQueryMessage`
 * is set (the default) a `?message=` handed over by a redirect is surfaced as the
 * form banner — sanitised (tags stripped, truncated to 200 chars) and always
 * styled as an error, since the query string is attacker-controllable and a green
 * banner carries more authority than a red one.
 */
export async function createAuthLoadForm<TSchema extends AuthSchema>(
	schema: TSchema,
	url: URL,
	options: CreateAuthLoadFormOptions = {}
) {
	const { includeQueryMessage = true, messageParam = 'message' } = options;
	const form = await superValidate(zod4(schema));

	if (includeQueryMessage) {
		const MAX_MSG_LEN = 200;
		const queryMessage = url.searchParams.get(messageParam);
		if (queryMessage) {
			form.message = {
				type: 'error',
				text: queryMessage.slice(0, MAX_MSG_LEN).replace(/<[^>]*>/g, '')
			};
		}
	}

	return form;
}
