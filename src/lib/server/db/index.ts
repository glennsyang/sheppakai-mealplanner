import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { logger } from '$lib/logger';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { getEnv } from '../../../env';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const env = getEnv();
    const dbUrl = env.DATABASE_URL;

    // Extract file path from DATABASE_URL (remove 'file://' prefix if present)
    const dbPath = dbUrl.replace(/^file:\/\//, '');

    // Ensure the directory exists
    const dir = dirname(dbPath);
    mkdirSync(dir, { recursive: true });

    const connection = new Database(dbPath);
    // Enable WAL mode for better concurrency
    connection.pragma('journal_mode = WAL');
    _db = drizzle(connection, { schema, logger: true });

    logger.info('Database connected', { path: dbPath });
  }

  return _db;
}
