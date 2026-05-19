import { describe, it, expect } from 'vitest';

import { loginSchema, registerSchema } from '../../lib/schemas/auth';

describe('loginSchema', () => {
	it('accepts valid credentials', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid email', () => {
		const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
		expect(result.success).toBe(false);
	});

	it('rejects empty password', () => {
		const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
		expect(result.success).toBe(false);
	});
});

describe('registerSchema', () => {
	const valid = {
		name: 'Alice',
		email: 'alice@example.com',
		password: 'password123',
		confirmPassword: 'password123'
	};

	it('accepts valid registration data', () => {
		const result = registerSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it('rejects mismatched passwords', () => {
		const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different' });
		expect(result.success).toBe(false);
	});

	it('rejects short name', () => {
		const result = registerSchema.safeParse({ ...valid, name: 'A' });
		expect(result.success).toBe(false);
	});

	it('rejects password shorter than 8 characters', () => {
		const result = registerSchema.safeParse({
			...valid,
			password: 'short',
			confirmPassword: 'short'
		});
		expect(result.success).toBe(false);
	});
});
