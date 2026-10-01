import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as schema from '../../lib/server/db/schema';

vi.mock('../../lib/server/logger', () => ({
	logger: {
		debug: vi.fn<() => void>(),
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

let currentDb: ReturnType<typeof drizzle<typeof schema>>;
vi.mock('../../lib/server/db', () => ({ getDb: () => currentDb }));

const { addMealPlanEntry, getMealPlanWithEntries } =
	await import('../../lib/server/services/mealPlan');

const MIGRATIONS = resolve(__dirname, '../../lib/server/db/migrations');
const TAGS: string[] = JSON.parse(
	readFileSync(resolve(MIGRATIONS, 'meta/_journal.json'), 'utf8')
).entries.map((e: { tag: string }) => e.tag);

/** Apply migrations the way drizzle-orm's migrator does: one BEGIN/COMMIT, FKs on. */
function applyMigrations(sqlite: Database.Database, tags: string[]) {
	sqlite.exec('BEGIN');
	for (const tag of tags) {
		const sql = readFileSync(resolve(MIGRATIONS, `${tag}.sql`), 'utf8');
		for (const stmt of sql.split('--> statement-breakpoint')) {
			if (stmt.trim()) sqlite.exec(stmt);
		}
	}
	sqlite.exec('COMMIT');
}

const ts = (n: number) => n * 1000;

function seedUser(sqlite: Database.Database, id: string) {
	sqlite
		.prepare(
			`INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 0, 0, 0)`
		)
		.run(id, id, `${id}@test.com`);
}

function seedRecipe(sqlite: Database.Database, id: string, userId: string) {
	sqlite
		.prepare(
			`INSERT INTO recipes (id, user_id, name, description, ingredients_json, instructions_json, prep_time_minutes, servings, created_at, updated_at)
			 VALUES (?, ?, ?, '', '[]', '[]', 10, 2, 0, 0)`
		)
		.run(id, userId, id);
}

describe('0005 migration (#164)', () => {
	it('keeps meal plan entries, collapses duplicate plans/days, and adds unique indexes', () => {
		const sqlite = new Database(':memory:');
		const lastTag = TAGS.findIndex((t) => t.startsWith('0005_'));
		applyMigrations(sqlite, TAGS.slice(0, lastTag));

		seedUser(sqlite, 'u1');
		seedRecipe(sqlite, 'r1', 'u1');
		seedRecipe(sqlite, 'r2', 'u1');
		const plan = sqlite.prepare(
			`INSERT INTO meal_plans (id, user_id, week_start_date, created_at, updated_at) VALUES (?, 'u1', ?, ?, ?)`
		);
		plan.run('p-old', '2026-09-28', ts(1), ts(1));
		plan.run('p-dup', '2026-09-28', ts(2), ts(2));
		plan.run('p-other', '2026-10-05', ts(1), ts(1));
		const entry = sqlite.prepare(
			`INSERT INTO meal_plan_entries (id, meal_plan_id, day_of_week, recipe_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
		);
		entry.run('e1', 'p-old', 0, 'r1', ts(1), ts(1));
		entry.run('e2', 'p-dup', 0, 'r2', ts(5), ts(5)); // newer Monday on the duplicate plan
		entry.run('e3', 'p-dup', 1, 'r1', ts(2), ts(2));
		entry.run('e4', 'p-other', 3, 'r2', ts(1), ts(1));

		applyMigrations(sqlite, TAGS.slice(lastTag, lastTag + 1));

		expect(sqlite.prepare(`SELECT id FROM meal_plans ORDER BY id`).pluck().all()).toEqual([
			'p-old',
			'p-other'
		]);
		expect(
			sqlite
				.prepare(
					`SELECT id, meal_plan_id, day_of_week, recipe_id FROM meal_plan_entries ORDER BY id`
				)
				.all()
		).toEqual([
			{ id: 'e2', meal_plan_id: 'p-old', day_of_week: 0, recipe_id: 'r2' },
			{ id: 'e3', meal_plan_id: 'p-old', day_of_week: 1, recipe_id: 'r1' },
			{ id: 'e4', meal_plan_id: 'p-other', day_of_week: 3, recipe_id: 'r2' }
		]);
		expect(() => plan.run('p-dup2', '2026-09-28', ts(9), ts(9))).toThrow(/UNIQUE/);
		expect(
			sqlite
				.prepare(`SELECT name FROM sqlite_master WHERE name = '__backup_meal_plan_entries'`)
				.get()
		).toBeUndefined();
	});
});

describe('shared rows survive user removal (#164)', () => {
	it('sets creator user_id to NULL instead of cascade-deleting', () => {
		const sqlite = new Database(':memory:');
		applyMigrations(sqlite, TAGS);
		seedUser(sqlite, 'u1');
		seedRecipe(sqlite, 'r1', 'u1');
		sqlite
			.prepare(
				`INSERT INTO pantry_items (id, user_id, name, created_at, updated_at) VALUES ('pi1', 'u1', 'rice', 0, 0)`
			)
			.run();

		sqlite.prepare(`DELETE FROM user WHERE id = 'u1'`).run();

		expect(sqlite.prepare(`SELECT user_id FROM recipes WHERE id = 'r1'`).get()).toEqual({
			user_id: null
		});
		expect(sqlite.prepare(`SELECT user_id FROM pantry_items WHERE id = 'pi1'`).get()).toEqual({
			user_id: null
		});
	});
});

describe('addMealPlanEntry (#164)', () => {
	let sqlite: Database.Database;

	beforeEach(() => {
		sqlite = new Database(':memory:');
		applyMigrations(sqlite, TAGS);
		currentDb = drizzle(sqlite, { schema });
		seedUser(sqlite, 'u1');
		seedUser(sqlite, 'u2');
		seedRecipe(sqlite, 'r1', 'u1');
		seedRecipe(sqlite, 'r2', 'u2');
	});

	it('reuses one shared plan per week across users', async () => {
		await addMealPlanEntry('u1', '2026-09-28', 0, 'r1');
		await addMealPlanEntry('u2', '2026-09-28', 1, 'r2');

		expect(sqlite.prepare(`SELECT COUNT(*) FROM meal_plans`).pluck().get()).toBe(1);
		const entries = await getMealPlanWithEntries('2026-09-28');
		expect(entries.map((e) => e.recipe.id).sort()).toEqual(['r1', 'r2']);
	});

	it('replaces the recipe for a day instead of adding a second entry', async () => {
		const first = await addMealPlanEntry('u1', '2026-09-28', 2, 'r1');
		const second = await addMealPlanEntry('u2', '2026-09-28', 2, 'r2');

		expect(second.recipeId).toBe('r2');
		expect(second.id).toBe(first.id);
		expect(sqlite.prepare(`SELECT COUNT(*) FROM meal_plan_entries`).pluck().get()).toBe(1);
	});

	it('handles concurrent calls for the same day without duplicates', async () => {
		await Promise.all([
			addMealPlanEntry('u1', '2026-10-05', 4, 'r1'),
			addMealPlanEntry('u2', '2026-10-05', 4, 'r2')
		]);

		expect(sqlite.prepare(`SELECT COUNT(*) FROM meal_plans`).pluck().get()).toBe(1);
		expect(sqlite.prepare(`SELECT COUNT(*) FROM meal_plan_entries`).pluck().get()).toBe(1);
	});
});
