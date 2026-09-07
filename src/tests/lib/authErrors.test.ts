import { describe, expect, it } from 'vitest';

import { getBetterAuthErrorMessage } from '../../lib/server/auth/errors';

describe('getBetterAuthErrorMessage', () => {
	it('returns a mapped message for a recognised error code', () => {
		const error = { body: { code: 'USER_ALREADY_EXISTS' } };
		expect(getBetterAuthErrorMessage(error)).toBe('This account already exists.');
	});

	it('returns the default message for an unrecognised error code', () => {
		const error = { body: { code: 'COMPLETELY_UNKNOWN_CODE' } };
		expect(getBetterAuthErrorMessage(error)).toBe('An error occurred. Please try again.');
	});

	it('returns the default message when there is no error code', () => {
		expect(getBetterAuthErrorMessage({})).toBe('An error occurred. Please try again.');
		expect(getBetterAuthErrorMessage(null)).toBe('An error occurred. Please try again.');
		expect(getBetterAuthErrorMessage(undefined)).toBe('An error occurred. Please try again.');
		expect(getBetterAuthErrorMessage(new Error('boom'))).toBe(
			'An error occurred. Please try again.'
		);
	});

	it('uses the supplied custom default when the code is absent', () => {
		expect(getBetterAuthErrorMessage({ body: {} }, 'Custom fallback')).toBe('Custom fallback');
	});

	it('uses the supplied custom default for an unrecognised code', () => {
		const error = { body: { code: 'NOT_IN_MAP' } };
		expect(getBetterAuthErrorMessage(error, 'Fallback message')).toBe('Fallback message');
	});

	it('maps INVALID_EMAIL_OR_PASSWORD', () => {
		const error = { body: { code: 'INVALID_EMAIL_OR_PASSWORD' } };
		expect(getBetterAuthErrorMessage(error, 'Invalid email or password')).toBe(
			'Invalid email or password. Please try again.'
		);
	});

	it('maps token errors surfaced on the reset-password action', () => {
		expect(getBetterAuthErrorMessage({ body: { code: 'INVALID_TOKEN' } })).toBe(
			'This link is invalid or has expired.'
		);
		expect(getBetterAuthErrorMessage({ body: { code: 'TOKEN_EXPIRED' } })).toBe(
			'This link has expired. Please request a new one.'
		);
	});
});
