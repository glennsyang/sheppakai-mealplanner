import { building, dev } from '$app/environment';
import { auth } from '$lib/server/auth';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

Sentry.init({
	dsn: 'https://9488e2141b5fc14a91a545a6425e0422@o4510809399492608.ingest.us.sentry.io/4511412699725824',
	tracesSampleRate: 1.0,
	enableLogs: true
});

export const handle: Handle = async ({ event, resolve }) => {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	// Better-auth session middleware
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Make session and user available on server
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

	// HSTS only in production
	if (!dev) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);
	}

	// Content-Security-Policy is managed via kit.csp in svelte.config.js (nonce mode).
	// SvelteKit generates a per-request nonce, injects it into inline scripts/styles it
	// produces, and sets the CSP header automatically. Sentry's sentryHandle() also
	// honours the nonce. Do NOT set Content-Security-Policy here — it would override
	// the nonce-bearing header that SvelteKit emits.

	return response;
};

export const handleError = Sentry.handleErrorWithSentry();
