import { building, dev } from '$app/environment';
import { logger } from '$lib/logger';
import { auth } from '$lib/server/auth';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response(undefined, { status: 404 });
  }

  // Better-auth session middleware
  const session = await auth.api.getSession({
    headers: event.request.headers,
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
      'max-age=31536000; includeSubDomains; preload',
    );
  }

  // Content-Security-Policy is managed via kit.csp in svelte.config.js (nonce mode).
  // SvelteKit generates a per-request nonce, injects it into inline scripts/styles it
  // produces, and sets the CSP header automatically. Sentry's sentryHandle() also
  // honours the nonce. Do NOT set Content-Security-Policy here — it would override
  // the nonce-bearing header that SvelteKit emits.

  return response;
};

/**
 * Global error handler with structured logging and stack trace capture
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
  const userId = event.locals.user?.id || 'anonymous';

  // Log error with sanitized context
  logger.error('Unhandled server error', { error, userId, status, message });

  // Return safe error message to client (hide internals in production)
  return {
    message: dev ? message : 'An unexpected error occurred',
  };
};
