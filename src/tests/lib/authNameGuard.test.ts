import { APIError } from 'better-auth/api';
import { describe, expect, it } from 'vitest';

import { MAX_NAME_LENGTH } from '../../lib/schemas/auth';
import { assertNameLength } from '../../lib/server/auth/name-guard';

describe('assertNameLength', () => {
	it('accepts a name at the maximum length', async () => {
		await expect(assertNameLength({ name: 'a'.repeat(MAX_NAME_LENGTH) })).resolves.toBeUndefined();
	});

	it('rejects a name over the maximum length with a BAD_REQUEST APIError', async () => {
		const result = assertNameLength({ name: 'a'.repeat(MAX_NAME_LENGTH + 1) });
		await expect(result).rejects.toBeInstanceOf(APIError);
		await expect(result).rejects.toMatchObject({ status: 'BAD_REQUEST' });
	});

	it('accepts an update that does not touch the name', async () => {
		await expect(assertNameLength({})).resolves.toBeUndefined();
		await expect(assertNameLength({ name: null })).resolves.toBeUndefined();
	});
});
