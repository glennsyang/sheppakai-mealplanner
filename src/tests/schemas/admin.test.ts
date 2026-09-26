import {
	banUserSchema,
	createUserSchema,
	removeUserSchema,
	setRoleSchema
} from '$lib/schemas/admin';
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

describe('createUserSchema', () => {
	it('accepts name + email and defaults the role to user', () => {
		const result = createUserSchema.safeParse({
			name: 'New',
			email: 'new@example.com'
		});
		expect(result.success && result.data.role).toBe('user');
	});

	it('trims and lowercases the email', () => {
		const result = createUserSchema.safeParse({
			name: 'New',
			email: '  New@Example.COM '
		});
		expect(result.success && result.data.email).toBe('new@example.com');
	});

	it('rejects an invalid email', () => {
		expect(createUserSchema.safeParse({ name: 'New', email: 'not-an-email' }).success).toBe(false);
	});

	it('rejects an empty or whitespace-only name', () => {
		expect(createUserSchema.safeParse({ name: '   ', email: 'new@example.com' }).success).toBe(
			false
		);
	});

	it('rejects an unknown role', () => {
		expect(
			createUserSchema.safeParse({
				name: 'New',
				email: 'new@example.com',
				role: 'superuser'
			}).success
		).toBe(false);
	});
});
