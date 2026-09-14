import { createAuthMiddleware } from 'better-auth/api';

import { sendNewUserEmail } from '../email';
import { logger } from '../logger';
import { sendAuthAlerts } from '../notifications';

/**
 * Shared `hooks.after` observability for Better Auth, copied verbatim into
 * sheppakai-budget / synapse (see `../../../../../auth-audit.md` #448) — only
 * `appName` differs per repo.
 *
 * Path matching is exact, not `.includes(...)`: Better Auth's internal
 * endpoint paths are `/sign-up/email` and `/sign-in/email` (the app's own
 * `/register` and `/sign-in` SvelteKit routes never appear here — they call
 * `auth.api.signUpEmail`/`signInEmail` directly). `ctx.context.newSession` is
 * the correct accessor for the session just created by either endpoint;
 * `ctx.context.session` is only populated by session-*requiring* endpoints
 * and is never set here.
 */
export function createAuthAfterHooks(appName: string) {
	return createAuthMiddleware(async (ctx) => {
		if (ctx.path === '/sign-up/email') {
			const newSession = ctx.context.newSession;
			if (newSession) {
				void sendNewUserEmail(newSession.user.email, newSession.user.name);
				void sendAuthAlerts(
					`New user registered: ${newSession.user.email}`,
					`${appName} - New User Alert`,
					4
				);
			}
		}
		if (ctx.path === '/sign-in/email') {
			const newSession = ctx.context.newSession;
			if (newSession) {
				logger.info('Sign-in successful', {
					email: newSession.user.email,
					ip: newSession.session.ipAddress
				});
			}
		}
	});
}

/**
 * Shared reset-password audit logging, called from `emailAndPassword.onPasswordReset`
 * rather than `hooks.after`: the `/reset-password` endpoint never populates
 * `ctx.context.session` or `ctx.context.newSession`, so `onPasswordReset`'s
 * `{ user }` argument is the only reliable source of who just reset their
 * password. It also fires exactly once, unlike a `hooks.after` path check
 * (which also matches the GET `/reset-password/:token` link-click callback).
 */
export function logPasswordResetAudit(user: { id: string; email: string }, appName: string) {
	logger.info('Security event: password reset completed and sessions revoked', {
		userId: user.id,
		email: user.email,
		timestamp: new Date().toISOString()
	});
	void sendAuthAlerts(
		`Password reset completed for ${user.email}`,
		`${appName} - Security Alert`,
		4
	);
}
