import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/server/db/index', () => ({ db: {} }));
vi.mock('../../lib/logger', () => ({
	logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function makeDb() {
	const sqlite = new Database(':memory:');
	sqlite.exec(`
		CREATE TABLE user (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			email_verified INTEGER NOT NULL DEFAULT 0,
			image TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE TABLE pantry_items (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			name TEXT NOT NULL,
			quantity REAL,
			unit TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
	`);
	return drizzle(sqlite, { schema });
}

describe('pantry operations (in-memory SQLite)', () => {
	const db = makeDb();
	const userId = 'test-user-1';

	beforeEach(() => {
		const now = new Date();
		// Clear and re-seed user
		db.delete(schema.pantryItems).where(eq(schema.pantryItems.userId, userId)).run();
		try {
			db.insert(schema.user).values({
				id: userId,
				name: 'Test User',
				email: `${userId}@test.com`,
				emailVerified: false,
				createdAt: now,
				updatedAt: now
			}).run();
		} catch {
			// User already exists — fine
		}
	});

	it('inserts and retrieves a pantry item', () => {
		const now = new Date();
		const id = randomUUID();
		db.insert(schema.pantryItems).values({
			id, userId, name: 'Tomatoes', quantity: 3, unit: 'pieces',
			createdAt: now, updatedAt: now
		}).run();

		const items = db.select().from(schema.pantryItems)
			.where(eq(schema.pantryItems.userId, userId)).all();
		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Tomatoes');
		expect(items[0].quantity).toBe(3);
	});

	it('deletes a pantry item', () => {
		const now = new Date();
		const id = randomUUID();
		db.insert(schema.pantryItems).values({
			id, userId, name: 'Garlic', quantity: null, unit: null,
			createdAt: now, updatedAt: now
		}).run();

		db.delete(schema.pantryItems)
			.where(and(eq(schema.pantryItems.id, id), eq(schema.pantryItems.userId, userId)))
			.run();

		const items = db.select().from(schema.pantryItems)
			.where(eq(schema.pantryItems.userId, userId)).all();
		expect(items).toHaveLength(0);
	});

	it('does not delete another user\'s items', () => {
		const now = new Date();
		const id = randomUUID();
		const otherId = 'other-user';
		db.insert(schema.pantryItems).values({
			id, userId, name: 'Onion', quantity: null, unit: null,
			createdAt: now, updatedAt: now
		}).run();

		db.delete(schema.pantryItems)
			.where(and(eq(schema.pantryItems.id, id), eq(schema.pantryItems.userId, otherId)))
			.run();

		const items = db.select().from(schema.pantryItems)
			.where(eq(schema.pantryItems.userId, userId)).all();
		expect(items).toHaveLength(1);
	});
});
