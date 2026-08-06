import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		// Nonce-based CSP: eliminates unsafe-inline from script-src.
		// Sentry's sentryHandle() automatically reads the nonce SvelteKit generates.
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				// unsafe-eval is required by layerchart/d3 (Function constructor / eval use).
				// unsafe-inline is intentionally absent — replaced by the per-request nonce.
				'script-src': ['self', 'unsafe-eval'],
				// unsafe-inline retained: Svelte injects inline <style> during SSR for scoped CSS.
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self'],
				'connect-src': ['self', 'https://*.ingest.us.sentry.io', 'https://*.ingest.sentry.io'],
				'frame-ancestors': ['none'],
				'object-src': ['none'],
				'base-uri': ['self']
			}
		},
		experimental: {
			explicitEnvironmentVariables: true
		}
	}
};

export default config;
