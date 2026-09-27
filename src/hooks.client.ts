import { PUBLIC_SENTRY_DSN } from '$app/env/public';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,

	tracesSampleRate: 0.2,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Keep user IPs, headers and user context out of Sentry; requestId is the only prod correlation key.
	sendDefaultPii: false
});

// Suppress SvelteKit router warnings from third-party libraries (e.g., LayerChart)
const originalWarn = console.warn;
console.warn = function (...args: unknown[]) {
	const message = String(args[0]);
	if (message.includes('history.pushState') || message.includes('history.replaceState')) {
		return; // Suppress this specific warning
	}
	originalWarn.apply(console, args);
};

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
