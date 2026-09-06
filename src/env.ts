import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

const DUMMY_DB_URL = 'file:///tmp/build.db';
const DUMMY_AUTH_SECRET = 'build_time_dummy_secret_min_32_chars_long';
const DUMMY_BREVO_KEY = 'dummy_key_for_build';
const DUMMY_BREVO_FROM = 'noreply@example.com';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Database connection URL',
		schema: building
			? z.string().default(DUMMY_DB_URL)
			: z
					.string()
					.min(1)
					.refine((val) => val !== DUMMY_DB_URL, {
						message: 'DATABASE_URL cannot be the dummy value in production'
					})
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret key for Better-auth session signing',
		schema: building
			? z.string().default(DUMMY_AUTH_SECRET)
			: z
					.string()
					.min(32)
					.refine((val) => val !== DUMMY_AUTH_SECRET, {
						message: 'BETTER_AUTH_SECRET cannot be the dummy value in production'
					})
	},
	BETTER_AUTH_BASE_URL: {
		description: 'Base URL for Better Auth callbacks and password reset redirects',
		schema: z.url().default('http://localhost:5173')
	},
	BREVO_API_KEY: {
		description: 'Brevo API key for sending transactional emails',
		schema: building
			? z.string().default(DUMMY_BREVO_KEY)
			: z
					.string()
					.min(1)
					.refine((val) => val !== DUMMY_BREVO_KEY, {
						message: 'BREVO_API_KEY cannot be the dummy value outside of build'
					})
	},
	BREVO_FROM_ADDRESS: {
		description:
			'From address for outgoing transactional emails (must be a confirmed Brevo sender)',
		schema: building
			? z.email().default(DUMMY_BREVO_FROM)
			: z.email().refine((val) => val !== DUMMY_BREVO_FROM, {
					message: 'BREVO_FROM_ADDRESS cannot be the dummy value outside of build'
				})
	},
	ANTHROPIC_API_KEY: {
		description: 'Anthropic API key',
		schema: z.string().min(1).default('dummy_key_for_build')
	},
	GEMINI_API_KEY: {
		description: 'Gemini API key',
		schema: z.string().min(1).default('dummy_key_for_build')
	},
	NODE_ENV: {
		description: 'Application runtime environment',
		schema: z.enum(['development', 'production', 'test']).default('development')
	},
	PUBLIC_SENTRY_DSN: {
		description:
			'Sentry DSN, sent to the browser to initialize error tracking client-side. Not a secret — defaults to the project DSN so no config is required.',
		public: true,
		static: true,
		schema: z
			.url()
			.default(
				'https://9488e2141b5fc14a91a545a6425e0422@o4510809399492608.ingest.us.sentry.io/4511412699725824'
			)
	}
});
