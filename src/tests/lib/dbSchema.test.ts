import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';

import { rateLimit, user } from '../../lib/server/db/schema';

// Regression guard for #59: better-auth's DB-backed rate limiter (used in
// production, see src/lib/server/auth/index.ts) reads/writes a `rateLimit`
// model. That model is passed to drizzleAdapter via an explicit schema map, so
// if this table (or any of the columns better-auth references by name) goes
// missing, every request through auth.handler() — notably the emailed
// verification link — 500s with "The model \"rateLimit\" was not found".
describe('rateLimit table (better-auth rate limiting)', () => {
	it('exposes the columns better-auth expects, by property name', () => {
		expect(Object.keys(getTableColumns(rateLimit)).sort()).toEqual([
			'count',
			'id',
			'key',
			'lastRequest'
		]);
	});

	it('maps to snake_case columns and keeps `key` unique', () => {
		const { columns } = getTableConfig(rateLimit);
		const lastRequest = columns.find((c) => c.name === 'last_request');
		const key = columns.find((c) => c.name === 'key');

		expect(lastRequest).toBeDefined();
		expect(key?.isUnique).toBe(true);
	});
});

// Parity columns for the better-auth `admin` plugin (tracking: sheppakai-budget#432).
// The plugin isn't wired up here yet, but the columns must exist with the right
// names/defaults so enabling it later is a config-only change and existing rows
// backfill correctly.
describe('user table role/banned parity columns', () => {
	it('exposes `role` and `banned` by property name', () => {
		const keys = Object.keys(getTableColumns(user));
		expect(keys).toContain('role');
		expect(keys).toContain('banned');
	});

	it('maps them to snake_case NOT NULL columns with user/false defaults', () => {
		const { columns } = getTableConfig(user);
		const role = columns.find((c) => c.name === 'role');
		const banned = columns.find((c) => c.name === 'banned');

		expect(role?.notNull).toBe(true);
		expect(role?.default).toBe('user');
		expect(banned?.notNull).toBe(true);
		expect(banned?.default).toBe(false);
	});
});
