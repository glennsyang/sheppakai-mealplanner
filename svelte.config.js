import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		// Nonce-based CSP. SvelteKit generates a per-request nonce, injects it into the
		// inline <script>/<style> it emits during SSR, and sets the Content-Security-Policy
		// header itself — hooks.server.ts must NOT set that header. Cross-repo strategy and
		// the per-app allowance table live in sheppakai-budget's docs/CSP.md.
		csp: {
			mode: 'nonce',
			directives: {
				'default-src': ['self'],
				// script-src 'self' only: this app has no charts (no layerchart/d3) and ships
				// no inline scripts of its own — the nonce covers SvelteKit's SSR-injected
				// scripts. The sveltekit-superforms -> arktype (@ark/util) one-shot
				// `new Function("return false")()` probe on first import is meant to be
				// blocked (arktype catches it and runs jitless); do NOT add 'unsafe-eval'.
				'script-src': ['self'],
				// unsafe-inline retained: Svelte injects inline <style> during SSR for scoped CSS.
				// fonts.googleapis.com: Google Fonts stylesheet loaded in app.html.
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'img-src': ['self', 'data:', 'https:'],
				// fonts.gstatic.com: Google Fonts files referenced by the app.html stylesheet.
				'font-src': ['self', 'https://fonts.gstatic.com'],
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
