import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { logger } from '$lib/logger';
import { getEnv } from '../../../env';

const env = getEnv();
const dbPath = env.DATABASE_URL;

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

logger.info('Database connected', { path: dbPath });

export const db = drizzle(sqlite, { schema });
