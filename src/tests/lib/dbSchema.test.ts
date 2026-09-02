import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';

import { rateLimit } from '../../lib/server/db/schema';

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
