import { describe, it, expect } from 'vitest';

import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resendVerificationSchema,
	resetPasswordSchema
} from '../../lib/schemas/auth';

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

describe('resendVerificationSchema', () => {
	it('accepts a valid email address', () => {
		expect(resendVerificationSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
	});

	it('rejects an invalid email address', () => {
		expect(resendVerificationSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
	});
});

describe('forgotPasswordSchema', () => {
	it('accepts a valid email address', () => {
		expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
	});

	it('rejects an invalid email address', () => {
		expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
	});
});

describe('resetPasswordSchema', () => {
	const valid = {
		password: 'brand-new-secret',
		confirmPassword: 'brand-new-secret',
		token: 'reset-token-123'
	};

	it('accepts a matching 12+ character password', () => {
		expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
	});

	it('treats the token as optional', () => {
		const { token, ...withoutToken } = valid;
		void token;
		expect(resetPasswordSchema.safeParse(withoutToken).success).toBe(true);
	});

	it('rejects mismatched passwords', () => {
		expect(
			resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'something-else' }).success
		).toBe(false);
	});

	it('rejects a password shorter than 12 characters', () => {
		expect(
			resetPasswordSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' })
				.success
		).toBe(false);
	});
});
