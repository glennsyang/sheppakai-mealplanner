import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { getEnv } from '../../../env';
import { getDb } from '../db';
import * as schema from '../db/schema';

const env = getEnv();

export const auth = betterAuth({
  appName: 'Meal Planner',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_BASE_URL,
  database: drizzleAdapter(getDb(), {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 10, // 10 minutes
  },
  advanced: {
    cookiePrefix: 'mealplanner_auth_',
    useSecureCookies: true,
    ipAddress: {
      // Enable IP address and user agent tracking
      disableIpTracking: false,
      // Optionally specify custom headers for IP detection (useful behind proxies)
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'x-client-ip'],
    },
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes client-side cache
    },
  },
  trustedOrigins: [
    'https://sheppakai-mealplanner.fly.dev',
    ...(env.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
  ],
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 5, // max 5 requests per window per IP
    storage: env.NODE_ENV === 'production' ? 'database' : 'memory',
  },
  plugins: [sveltekitCookies(getRequestEvent)], // make sure this is the last plugin in the array
});
