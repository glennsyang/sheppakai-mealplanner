import { logger } from '$lib/logger';
import { db } from '$lib/server/db';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // 1. Verify the DB is responsive
    // This ensures the Fly.io volume is mounted and the file is readable
    db.run('SELECT 1');

    return new Response('OK', { status: 200, headers: { 'Cache-Control': 'no-cache' } });
  } catch (e) {
    logger.error('Health check failed', e);

    // Returning a non-200 status tells Fly.io the instance is unhealthy
    return new Response('Service Unavailable', { status: 503 });
  }
};
