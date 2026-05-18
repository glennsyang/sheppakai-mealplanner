import { logger } from '$lib/logger';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { getEnv } from '../../../env';
import * as schema from './schema';

const env = getEnv();
const dbPath = env.DATABASE_URL;

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

logger.info('Database connected', { path: dbPath });

export const db = drizzle(sqlite, { schema });
