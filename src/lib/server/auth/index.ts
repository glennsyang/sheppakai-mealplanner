import { BETTER_AUTH_BASE_URL, BETTER_AUTH_SECRET, NODE_ENV } from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { getDb } from '../db';
import * as schema from '../db/schema';
import { sendVerificationEmail } from '../email';

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
		resetPasswordTokenExpiresIn: 60 * 10 // 10 minutes
	},
	emailVerification: {
		sendOnSignUp: true,
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
	plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
