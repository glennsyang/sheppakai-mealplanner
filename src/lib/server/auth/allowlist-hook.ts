import { BASE_ERROR_CODES } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';

import { sendAuthAlerts } from '../notifications';

const GUARDED_PATHS = new Set(['/sign-up/email', '/sign-in/email']);

/**
 * Parse the comma-separated `ALLOWED_EMAILS` env value into a normalised set.
 * Matching is exact after trim + lowercase — never a substring match.
 */
export function parseAllowedEmails(raw: string): Set<string> {
	return new Set(
		raw
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean)
	);
}

/**
 * Use-time access check for an already-authenticated user (session or API key owner).
 * The sign-in / session-create gates below only run when a session is created, so this
 * is what revokes access for someone later removed from `ALLOWED_EMAILS` or banned.
 * A ban with a `banExpires` in the past no longer counts, matching the admin plugin.
 */
export function isUserAccessAllowed(
	user: {
		email: string;
		banned?: boolean | null;
		banExpires?: Date | string | null;
	},
	allowedEmails: Set<string>
): boolean {
	if (!allowedEmails.has(user.email.trim().toLowerCase())) {
		return false;
	}
	if (!user.banned) {
		return true;
	}
	return user.banExpires != null && new Date(user.banExpires).getTime() < Date.now();
}

const ALERT_EMAIL_PATTERN = /^[^\s@\p{Cc}\p{Cf}]{1,64}@[^\s@\p{Cc}\p{Cf}]{1,190}$/u;
const DEFAULT_ALERT_WINDOW_MS = 5 * 60 * 1000;

/**
 * The submitted email is attacker-controlled, so only a single-line, length-bounded
 * address is echoed into an operator alert; anything else is replaced with a placeholder.
 */
export function formatAlertEmail(email: string): string {
	if (!email) {
		return '(none)';
	}
	return ALERT_EMAIL_PATTERN.test(email) ? email : '(invalid email)';
}

/**
 * `hooks.before` gate for Better Auth: only emails in `allowedEmails` may reach
 * `/sign-in/email` (or `/sign-up/email`, which is also disabled outright via
 * `emailAndPassword.disableSignUp`). Anything else is rejected with the exact
 * error Better Auth throws for a wrong password, so a blocked email can't be told
 * apart from a bad credential, and raises an auth alert.
 *
 * Alerts are debounced to one per `alertWindowMs`; attempts inside the window are
 * counted and reported with the next alert, so a flood can't spam the operator.
 */
export function createAllowlistBeforeHook(
	appName: string,
	allowedEmails: Set<string>,
	{
		alertWindowMs = DEFAULT_ALERT_WINDOW_MS,
		now = Date.now
	}: { alertWindowMs?: number; now?: () => number } = {}
) {
	let lastAlertAt = -Infinity;
	let suppressed = 0;

	return createAuthMiddleware(async (ctx) => {
		if (!GUARDED_PATHS.has(ctx.path)) {
			return;
		}
		const email = typeof ctx.body?.email === 'string' ? ctx.body.email.trim().toLowerCase() : '';
		if (email && allowedEmails.has(email)) {
			return;
		}
		const timestamp = now();
		if (timestamp - lastAlertAt >= alertWindowMs) {
			const suppressedNote = suppressed ? ` (+${suppressed} more suppressed since last alert)` : '';
			lastAlertAt = timestamp;
			suppressed = 0;
			void sendAuthAlerts(
				`⚠️ Blocked ${ctx.path} attempt for non-allowlisted email: ${formatAlertEmail(email)}${suppressedNote} at ${new Date(timestamp).toISOString()}.`,
				`${appName} - Security Alert`,
				3
			);
		} else {
			suppressed++;
		}
		throw APIError.from('UNAUTHORIZED', BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	});
}

/**
 * `databaseHooks.session.create.before` gate: refuses to create a session for any
 * user whose email isn't allowlisted. The before-hook above only covers
 * `/sign-in/email`; this also closes every other session-creating flow — notably
 * verify-email's `autoSignInAfterVerification`, which an unverified,
 * non-allowlisted account could otherwise use to get signed in.
 */
export function createAllowlistSessionGuard(
	allowedEmails: Set<string>,
	findUserEmail: (userId: string) => Promise<string | undefined>
) {
	return async (session: { userId: string }) => {
		const email = (await findUserEmail(session.userId))?.trim().toLowerCase();
		if (email && allowedEmails.has(email)) {
			return;
		}
		throw APIError.from('UNAUTHORIZED', BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
	};
}
