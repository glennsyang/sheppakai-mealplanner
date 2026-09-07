import { AUTH_ALERTS_URL } from '$app/env/private';

import { logger } from '../logger';

/**
 * Sends a security/auth push notification (ntfy.sh).
 *
 * Best-effort: a delivery failure is logged and swallowed (returns `false`) so it
 * never breaks the auth flow that triggered it. In dev/CI, `AUTH_ALERTS_URL` falls
 * back to a dummy value (see src/env.ts) and this simply no-ops.
 *
 * @param message The main body of the notification
 * @param title Optional title
 * @param priority 1-5 (5 is max/urgent)
 */
export async function sendAuthAlerts(message: string, title = 'App Alert', priority = 3) {
	try {
		const response = await fetch(`${AUTH_ALERTS_URL}`, {
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
