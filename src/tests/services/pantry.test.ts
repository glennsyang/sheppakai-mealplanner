import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/server/db/index', () => ({ db: {} }));
vi.mock('../../lib/logger', () => ({
	logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import { randomUUID } from 'crypto';

import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '../../lib/server/db/schema';

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
		// Clear all pantry items (shared data model — no per-user filtering)
		db.delete(schema.pantryItems).run();
		try {
			db.insert(schema.user)
				.values({
					id: userId,
					name: 'Test User',
					email: `${userId}@test.com`,
					emailVerified: false,
					createdAt: now,
					updatedAt: now
				})
				.run();
		} catch {
			// User already exists — fine
		}
	});

	it('inserts and retrieves a pantry item', () => {
		const now = new Date();
		const id = randomUUID();
		db.insert(schema.pantryItems)
			.values({
				id,
				userId,
				name: 'Tomatoes',
				quantity: 3,
				unit: 'pieces',
				createdAt: now,
				updatedAt: now
			})
			.run();

		const items = db.select().from(schema.pantryItems).all();
		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Tomatoes');
		expect(items[0].quantity).toBe(3);
	});

	it('deletes a pantry item by id regardless of owner', () => {
		const now = new Date();
		const id = randomUUID();
		const otherUserId = 'other-user';
		db.insert(schema.pantryItems)
			.values({
				id,
				userId: otherUserId,
				name: 'Garlic',
				quantity: null,
				unit: null,
				createdAt: now,
				updatedAt: now
			})
			.run();

		// Any user can delete any item by id in the shared model
		db.delete(schema.pantryItems).where(eq(schema.pantryItems.id, id)).run();

		const items = db.select().from(schema.pantryItems).all();
		expect(items).toHaveLength(0);
	});

	it('lists items from all users', () => {
		const now = new Date();
		db.insert(schema.pantryItems)
			.values({
				id: randomUUID(),
				userId,
				name: 'Onion',
				quantity: null,
				unit: null,
				createdAt: now,
				updatedAt: now
			})
			.run();
		db.insert(schema.pantryItems)
			.values({
				id: randomUUID(),
				userId: 'other-user',
				name: 'Garlic',
				quantity: null,
				unit: null,
				createdAt: now,
				updatedAt: now
			})
			.run();

		const items = db.select().from(schema.pantryItems).all();
		expect(items).toHaveLength(2);
	});
});
