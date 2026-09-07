import { AUTH_ALERTS_URL } from '$app/env/private';

import { logger } from '../logger';

/**
 * Sends a security/auth push notification (ntfy.sh).
 *
 * Best-effort: a delivery failure is logged and swallowed (returns `false`) so it
 * never breaks the auth flow that triggered it.
 *
 * Fails closed: when `AUTH_ALERTS_URL` is unset it defaults to a non-resolving
 * `.invalid` host (see src/env.ts). We detect that here and skip the request
 * entirely — the alert body carries a user's name/email, so it must never be
 * POSTed to a placeholder domain.
 *
 * @param message The main body of the notification
 * @param title Optional title
 * @param priority 1-5 (5 is max/urgent)
 */
export async function sendAuthAlerts(message: string, title = 'App Alert', priority = 3) {
	let target: URL;
	try {
		target = new URL(AUTH_ALERTS_URL);
	} catch {
		logger.error('AUTH_ALERTS_URL is not a valid URL; skipping auth alert');
		return false;
	}
	if (target.hostname === 'invalid' || target.hostname.endsWith('.invalid')) {
		logger.info('Auth alerts disabled (AUTH_ALERTS_URL unset); skipping');
		return false;
	}

	try {
		const response = await fetch(target.href, {
			method: 'POST',
			body: message,
			headers: {
				Title: title,
				Priority: priority.toString(),
				Tags: 'rotating_light'
			}
		});

		return response.ok;
	} catch (err) {
		logger.error('Notification failed', err);
		return false;
	}
}
