// Standalone migration runner used at container boot (see start.sh).
//
// Uses drizzle-orm's migrator (a runtime dependency) instead of the drizzle-kit
// CLI, so drizzle-kit can stay a devDependency and be pruned from the production
// image. drizzle-orm's migrator reads the same meta/_journal.json and tracks
// applied migrations in the same __drizzle_migrations table that drizzle-kit
// writes, so previously-applied migrations are not re-run.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Extract file path from DATABASE_URL (remove 'file://' prefix if present),
// matching the parsing in src/lib/server/db/index.ts.
const dbPath = DATABASE_URL.replace(/^file:\/\//, '');

const dir = dirname(dbPath);
mkdirSync(dir, { recursive: true });

const migrationsFolder = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../src/lib/server/db/migrations'
);

console.log(`Applying migrations to ${dbPath} from ${migrationsFolder}`);

const connection = new Database(dbPath);
try {
	migrate(drizzle(connection), { migrationsFolder });
} finally {
	connection.close();
}

console.log('Migrations applied successfully');
