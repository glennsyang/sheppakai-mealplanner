import { describe, it, expect } from 'vitest';

import {
	changePasswordSchema,
	forgotPasswordSchema,
	loginSchema,
	resendVerificationSchema,
	resetPasswordSchema,
	updateNameSchema
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
		password: 'Brand-New-Secret1!',
		confirmPassword: 'Brand-New-Secret1!',
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

	it('accepts a password with no complexity, only length', () => {
		expect(
			resetPasswordSchema.safeParse({
				...valid,
				password: 'alllowercase',
				confirmPassword: 'alllowercase'
			}).success
		).toBe(true);
	});
});

describe('changePasswordSchema', () => {
	const valid = {
		currentPassword: 'old-password-1',
		newPassword: 'brand-new-secret',
		confirmPassword: 'brand-new-secret'
	};

	it('accepts a valid change with a matching 12+ char new password', () => {
		expect(changePasswordSchema.safeParse(valid).success).toBe(true);
	});

	it('rejects an empty current password', () => {
		expect(changePasswordSchema.safeParse({ ...valid, currentPassword: '' }).success).toBe(false);
	});

	it('rejects a new password shorter than 12 characters', () => {
		expect(
			changePasswordSchema.safeParse({
				...valid,
				newPassword: 'short',
				confirmPassword: 'short'
			}).success
		).toBe(false);
	});

	it('rejects a mismatched confirmation', () => {
		expect(
			changePasswordSchema.safeParse({ ...valid, confirmPassword: 'something-else' }).success
		).toBe(false);
	});
});

describe('updateNameSchema', () => {
	it('accepts a valid name', () => {
		expect(updateNameSchema.safeParse({ name: 'Alice' }).success).toBe(true);
	});

	it('rejects a name shorter than 2 characters', () => {
		expect(updateNameSchema.safeParse({ name: 'A' }).success).toBe(false);
	});

	it('rejects a name longer than 100 characters', () => {
		expect(updateNameSchema.safeParse({ name: 'A'.repeat(101) }).success).toBe(false);
	});
});
