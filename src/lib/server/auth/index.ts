import { BETTER_AUTH_BASE_URL, BETTER_AUTH_SECRET, NODE_ENV } from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { getDb } from '../db';
import * as schema from '../db/schema';
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendVerificationEmail } from '../email';
import { logger } from '../logger';
import { sendAuthAlerts } from '../notifications';

export const auth = betterAuth({
	appName: 'Meal Planner',
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_BASE_URL,
	database: drizzleAdapter(getDb(), {
		provider: 'sqlite',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
			rateLimit: schema.rateLimit
		}
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		requireEmailVerification: true,
		minPasswordLength: 12,
		maxPasswordLength: 128,
		resetPasswordTokenExpiresIn: 60 * 10, // 10 minutes
		// Invalidate every existing session when the password is reset — a reset is
		// the recovery path for a suspected-compromised account, so any session an
		// attacker may hold must not survive it.
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			// `url` is better-auth's complete reset link. It points at the GET verifier
			// (/api/auth/reset-password/<token>?callbackURL=/reset-password), which
			// checks the token then 302s to /reset-password?token=<token> (or
			// ?error=INVALID_TOKEN). Pass it straight through — same as
			// sendVerificationEmail — don't append `?token=` again.
			//
			// Await the send (don't fire-and-forget): sendPasswordResetEmail throws on
			// failure, and letting that propagate keeps the send tied to the request
			// lifecycle (Fly can suspend the machine as soon as the response returns)
			// and surfaces delivery failures in the logs / Sentry instead of a silent
			// "link sent" with no email.
			await sendPasswordResetEmail(user.email, user.name || user.email, url);
		},
		// Runs after a reset completes and every session has been revoked
		// (revokeSessionsOnPasswordReset above). Fire-and-forget: the reset itself
		// has already succeeded, so a failing confirmation email or push alert must
		// not break the response. Parity with sheppakai-budget (tracking:
		// sheppakai-budget#432).
		onPasswordReset: async ({ user }) => {
			logger.info('Security event: password reset completed and sessions revoked', {
				userId: user.id,
				email: user.email,
				timestamp: new Date().toISOString()
			});
			void sendPasswordChangedEmail({
				to: user.email,
				name: user.name || user.email,
				changedAt: new Date(),
				source: 'Password reset flow'
			}).catch((err) => logger.error('Password changed email failed', err));
			void sendAuthAlerts(
				`⚠️ Password reset for ${user.name || user.email} ${user.email} at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}. All sessions revoked.`,
				'Meal Planner - Security Alert',
				4
			);
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		// Without this, better-auth only sends the verification email once, on
		// sign-up. A user who never received that first email (or let the 10-min
		// link expire) then hits a dead end: signing in throws EMAIL_NOT_VERIFIED
		// and the /verify-email page claims "we sent you a link" without anything
		// actually being sent. sendOnSignIn re-sends a fresh link on every
		// unverified sign-in attempt, which is the flow that page assumes.
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			// `url` is already the complete verification link (token + callbackURL).
			// Don't append `?token=` again — that produced a malformed double-`?` URL
			// and leaked the token into the post-verification redirect target.
			//
			// Await the send (don't fire-and-forget): sendVerificationEmail throws on
			// failure, and letting that propagate keeps the send tied to the request
			// lifecycle (Fly can suspend the machine as soon as the response returns)
			// and surfaces delivery failures in the logs / Sentry instead of a silent
			// "link sent" with no email.
			await sendVerificationEmail(user.email, user.name || user.email, url);
		}
	},
	advanced: {
		cookiePrefix: 'mealplanner_auth_',
		useSecureCookies: true,
		ipAddress: {
			// Enable IP address and user agent tracking
			disableIpTracking: false,
			// fly-client-ip is set by Fly.io's edge proxy from the actual TCP connection
			// and can't be spoofed by the client — Fly overwrites any client-supplied
			// value for that header name. It's listed first so it wins whenever present.
			// The remaining headers ARE client-forwardable and, with no
			// advanced.ipAddress.trustedProxies configured, better-auth trusts a
			// single-value header as-is — so on their own they'd let a client fake a
			// fresh IP per request and dodge rate limiting. They're kept only as a
			// fallback for non-Fly contexts (e.g. local dev behind another proxy); this
			// app is deployed exclusively on Fly.io (see CLAUDE.md), where fly-client-ip
			// is always present. If that ever changes, configure
			// advanced.ipAddress.trustedProxies with the real proxy's IP/CIDR range
			// instead of relying on header order alone.
			ipAddressHeaders: ['fly-client-ip', 'x-forwarded-for', 'x-real-ip', 'x-client-ip']
		},
		database: {
			generateId: () => crypto.randomUUID()
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // Update every 24 hours
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // 5 minutes client-side cache
		}
	},
	trustedOrigins: [
		'https://sheppakai-mealplanner.fly.dev',
		...(NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
	],
	rateLimit: {
		enabled: true,
		window: 60, // 1 minute
		max: 5, // max 5 requests per window per IP
		storage: NODE_ENV === 'production' ? 'database' : 'memory'
	},
	plugins: [
		// User administration: adds `role` / `banned` / `banReason` / `banExpires` to the `user`
		// model and the `auth.api.listUsers` / `banUser` / `unbanUser` / `setRole` / `removeUser`
		// server endpoints that /admin drives. `defaultRole` / `adminRoles` are the plugin
		// defaults, spelled out here so the policy is visible. The first admin is promoted by a
		// one-off SQL UPDATE (there is no self-service path) — see the #75 PR description.
		admin({ defaultRole: 'user', adminRoles: ['admin'] }),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

// Session shapes with every plugin's additional fields folded in (the `admin` plugin adds
// `role` / `banned` / … to `user`). Used for `App.Locals` and component props so the app has
// one source of truth for the authenticated-user type.
export type SessionUser = typeof auth.$Infer.Session.user;
export type SessionData = typeof auth.$Infer.Session.session;
