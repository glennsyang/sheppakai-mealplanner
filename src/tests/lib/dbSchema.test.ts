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

// Columns for the better-auth `admin` plugin (wired up in src/lib/server/auth/index.ts,
// tracking: #75). The plugin reads/writes `role`, `banned`, `ban_reason` and `ban_expires`
// on the `user` model by name — if any drift, ban/role actions from /admin break.
describe('user table admin-plugin columns', () => {
	it('exposes `role`, `banned`, `banReason` and `banExpires` by property name', () => {
		const keys = Object.keys(getTableColumns(user));
		expect(keys).toContain('role');
		expect(keys).toContain('banned');
		expect(keys).toContain('banReason');
		expect(keys).toContain('banExpires');
	});

	it('maps role/banned to snake_case NOT NULL columns with user/false defaults', () => {
		const { columns } = getTableConfig(user);
		const role = columns.find((c) => c.name === 'role');
		const banned = columns.find((c) => c.name === 'banned');

		expect(role?.notNull).toBe(true);
		expect(role?.default).toBe('user');
		expect(banned?.notNull).toBe(true);
		expect(banned?.default).toBe(false);
	});

	it('maps ban_reason / ban_expires to nullable snake_case columns', () => {
		const { columns } = getTableConfig(user);
		const banReason = columns.find((c) => c.name === 'ban_reason');
		const banExpires = columns.find((c) => c.name === 'ban_expires');

		expect(banReason).toBeDefined();
		expect(banReason?.notNull).toBe(false);
		expect(banExpires).toBeDefined();
		expect(banExpires?.notNull).toBe(false);
	});
});
