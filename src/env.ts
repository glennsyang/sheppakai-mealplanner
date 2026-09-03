import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

const DUMMY_DB_URL = 'file:///tmp/build.db';
const DUMMY_AUTH_SECRET = 'build_time_dummy_secret_min_32_chars_long';
const DUMMY_RESEND_KEY = 'dummy_key_for_build';
const DUMMY_RESEND_FROM = 'noreply@example.com';

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
	RESEND_API_KEY: {
		description: 'Resend API key for sending transactional emails',
		// Falls back to a dummy only during `building`; at runtime a real key is
		// required. Without this guard a missing secret silently no-ops every
		// email send (Resend returns a 401 error object it never throws).
		schema: building
			? z.string().default(DUMMY_RESEND_KEY)
			: z
					.string()
					.min(1)
					.refine((val) => val !== DUMMY_RESEND_KEY, {
						message: 'RESEND_API_KEY cannot be the dummy value outside of build'
					})
	},
	RESEND_FROM_ADDRESS: {
		description: 'From address for outgoing transactional emails',
		schema: building
			? z.email().default(DUMMY_RESEND_FROM)
			: z.email().refine((val) => val !== DUMMY_RESEND_FROM, {
					message: 'RESEND_FROM_ADDRESS cannot be the dummy value outside of build'
				})
	},
	RESEND_NEW_USER_ADDRESS: {
		description: 'Address to CC on new user registration confirmation emails',
		schema: z.email().default('admin@example.com')
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
	}
});
