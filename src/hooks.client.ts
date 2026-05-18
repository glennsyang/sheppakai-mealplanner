import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://9488e2141b5fc14a91a545a6425e0422@o4510809399492608.ingest.us.sentry.io/4511412699725824',

  tracesSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
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
