import { banUserSchema, removeUserSchema, setRoleSchema } from '$lib/schemas/admin';
import { describe, expect, it } from 'vitest';

describe('setRoleSchema', () => {
	it('accepts a valid userId + known role', () => {
		expect(setRoleSchema.safeParse({ userId: 'u1', role: 'admin' }).success).toBe(true);
	});

	it('rejects an unknown role', () => {
		expect(setRoleSchema.safeParse({ userId: 'u1', role: 'superuser' }).success).toBe(false);
	});

	it('rejects a missing userId', () => {
		expect(setRoleSchema.safeParse({ role: 'user' }).success).toBe(false);
	});
});

describe('banUserSchema', () => {
	it('accepts a userId with no reason', () => {
		expect(banUserSchema.safeParse({ userId: 'u1' }).success).toBe(true);
	});

	it('accepts an optional reason and rejects an over-long one', () => {
		expect(banUserSchema.safeParse({ userId: 'u1', banReason: 'spam' }).success).toBe(true);
		expect(banUserSchema.safeParse({ userId: 'u1', banReason: 'x'.repeat(501) }).success).toBe(
			false
		);
	});
});

describe('removeUserSchema', () => {
	it('requires a non-empty userId', () => {
		expect(removeUserSchema.safeParse({ userId: '' }).success).toBe(false);
		expect(removeUserSchema.safeParse({ userId: 'u1' }).success).toBe(true);
	});
});
