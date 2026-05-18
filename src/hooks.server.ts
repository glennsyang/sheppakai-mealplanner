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

  // Content Security Policy (adjust as needed)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for layerchart/d3
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline needed for SvelteKit, Google Fonts for typography
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com", // Google Fonts
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

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
