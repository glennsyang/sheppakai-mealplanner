import { z } from 'zod';

import { building, dev } from '$app/environment';

import { env } from '$env/dynamic/private';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_BASE_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_ADDRESS: z.email(),
  RESEND_NEW_USER_ADDRESS: z.email(),
  ANTHROPIC_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Only validate in production (skip during build and dev)
if (!building && !dev) {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

/**
 * Build-time fallback values for environment variables.
 * These are used when the app is being built and actual env vars may not be available.
 */
const ENV_FALLBACKS = {
  DATABASE_URL: 'file:///tmp/build.db',
  BETTER_AUTH_SECRET: 'build_time_dummy_secret_min_32_chars_long',
  BETTER_AUTH_BASE_URL: 'http://localhost:5173',
  RESEND_API_KEY: 'dummy_key_for_build',
  RESEND_FROM_ADDRESS: 'noreply@example.com',
  RESEND_NEW_USER_ADDRESS: 'admin@example.com',
  ANTHROPIC_API_KEY: 'dummy_anthropic_api_key',
  GEMINI_API_KEY: 'dummy_gemini_api_key',
  NODE_ENV: 'development',
} as const;

/**
 * Get environment variables with automatic fallback to build-time defaults.
 * This is the single source of truth for accessing environment variables.
 *
 * Critical variables (BETTER_AUTH_SECRET, DATABASE_URL):
 * - During build: use fallbacks
 * - In development: allow fallbacks for convenience
 * - In production: require real values, no fallbacks, fail fast if missing or using dummy values
 *
 * @returns Object containing all environment variables with fallbacks applied
 */
export function getEnv() {
  let betterAuthSecret: string;
  let databaseUrl: string;

  if (building) {
    // During build: use fallbacks
    betterAuthSecret = ENV_FALLBACKS.BETTER_AUTH_SECRET;
    databaseUrl = ENV_FALLBACKS.DATABASE_URL;
  } else if (dev) {
    // In development: allow fallbacks for convenience
    betterAuthSecret =
      env.BETTER_AUTH_SECRET || ENV_FALLBACKS.BETTER_AUTH_SECRET;
    databaseUrl = env.DATABASE_URL || ENV_FALLBACKS.DATABASE_URL;
  } else {
    // In production: require real values, no fallbacks
    if (!env.BETTER_AUTH_SECRET) {
      console.error(
        '❌ CRITICAL: BETTER_AUTH_SECRET is required in production',
      );
      process.exit(1);
    }
    if (env.BETTER_AUTH_SECRET === ENV_FALLBACKS.BETTER_AUTH_SECRET) {
      console.error(
        '❌ CRITICAL: Cannot use dummy BETTER_AUTH_SECRET in production',
      );
      process.exit(1);
    }
    if (!env.DATABASE_URL) {
      console.error('❌ CRITICAL: DATABASE_URL is required in production');
      process.exit(1);
    }
    if (env.DATABASE_URL === ENV_FALLBACKS.DATABASE_URL) {
      console.error('❌ CRITICAL: Cannot use dummy DATABASE_URL in production');
      process.exit(1);
    }

    betterAuthSecret = env.BETTER_AUTH_SECRET;
    databaseUrl = env.DATABASE_URL;
  }

  return {
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
    // Less critical vars can use fallbacks in any environment
    BETTER_AUTH_BASE_URL:
      env.BETTER_AUTH_BASE_URL || ENV_FALLBACKS.BETTER_AUTH_BASE_URL,
    RESEND_API_KEY: env.RESEND_API_KEY || ENV_FALLBACKS.RESEND_API_KEY,
    RESEND_FROM_ADDRESS:
      env.RESEND_FROM_ADDRESS || ENV_FALLBACKS.RESEND_FROM_ADDRESS,
    RESEND_NEW_USER_ADDRESS:
      env.RESEND_NEW_USER_ADDRESS || ENV_FALLBACKS.RESEND_NEW_USER_ADDRESS,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || ENV_FALLBACKS.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: env.GEMINI_API_KEY || ENV_FALLBACKS.GEMINI_API_KEY,
    NODE_ENV:
      (env.NODE_ENV as 'development' | 'production' | 'test') ||
      ENV_FALLBACKS.NODE_ENV,
  };
}
