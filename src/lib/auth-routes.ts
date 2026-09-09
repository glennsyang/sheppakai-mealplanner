/**
 * Canonical auth route paths.
 *
 * Single source of truth for every auth-related URL in the app — imported by both
 * client (`.svelte`) and server code. No inline route literals anywhere else.
 *
 * Convention (see `auth-audit.md` §2A, issue #435): a `(auth)` route group with
 * unprefixed URLs and the `sign-in` / `sign-out` verb set.
 */

/** Where unauthenticated visitors are sent. */
export const SIGN_IN_ROUTE = '/sign-in';

/** Sign-out form action target. */
export const SIGN_OUT_ROUTE = '/sign-out';

/** New-account registration page. */
export const REGISTER_ROUTE = '/register';

/** Request a password-reset link. */
export const FORGOT_PASSWORD_ROUTE = '/forgot-password';

/** Complete a password reset (expects a `?token`). */
export const RESET_PASSWORD_ROUTE = '/reset-password';

/** Email-verification landing page (expects an `?email`). */
export const VERIFY_EMAIL_ROUTE = '/verify-email';

/**
 * Where authenticated users land after signing in. This app's authenticated home
 * lives at `/` (`(app)/+page.svelte`); budget/synapse use `/dashboard` because
 * they have a dedicated dashboard route.
 */
export const POST_LOGIN_ROUTE = '/';
