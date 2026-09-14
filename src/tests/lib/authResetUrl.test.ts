import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLoggerWarn = vi.hoisted(() => vi.fn<() => void>());
const mockFindFirst = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('$app/env/private', () => ({
	BETTER_AUTH_BASE_URL: 'https://sheppakai-mealplanner.fly.dev',
	NODE_ENV: 'production'
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		warn: mockLoggerWarn,
		info: vi.fn<() => void>(),
		debug: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

vi.mock('drizzle-orm', () => ({
	eq: (field: unknown, value: unknown) => ({ type: 'eq', field, value })
}));

vi.mock('$lib/server/db', () => ({
	getDb: () => ({ query: { verification: { findFirst: mockFindFirst } } })
}));

vi.mock('$lib/server/db/schema', () => ({
	verification: { identifier: 'verification.identifier' }
}));

import { buildResetUrl, isResetTokenValid } from '$lib/server/auth-reset-url';

const ALLOWED_ORIGIN = 'https://sheppakai-mealplanner.fly.dev';
const TOKEN = 'abc123resettoken';

describe('buildResetUrl', () => {
	describe('valid allowed origin', () => {
		it('returns a URL string for an allowed origin', () => {
			const result = buildResetUrl(`${ALLOWED_ORIGIN}/reset-password`, TOKEN);
			expect(result).toBeTypeOf('string');
		});

		it('appends the token via searchParams (no double question mark)', () => {
			const result = buildResetUrl(`${ALLOWED_ORIGIN}/reset-password`, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('token')).toBe(TOKEN);
			expect(result.split('?').length).toBe(2);
		});

		it('overwrites an existing token param rather than duplicating it', () => {
			const callbackURL = `${ALLOWED_ORIGIN}/reset-password?token=oldtoken`;
			const result = buildResetUrl(callbackURL, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('token')).toBe(TOKEN);
			expect(url.searchParams.getAll('token')).toHaveLength(1);
		});

		it('preserves existing non-token query params', () => {
			const callbackURL = `${ALLOWED_ORIGIN}/reset-password?redirect=%2Fplanner`;
			const result = buildResetUrl(callbackURL, TOKEN);
			const url = new URL(result);
			expect(url.searchParams.get('redirect')).toBe('/planner');
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('does not call logger.warn for a trusted origin', () => {
			buildResetUrl(`${ALLOWED_ORIGIN}/reset-password`, TOKEN);
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});
	});

	describe('root-relative callbackURL', () => {
		it('resolves a relative path against the base URL and appends the token', () => {
			const result = buildResetUrl('/reset-password', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.pathname).toBe('/reset-password');
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('does not call logger.warn for a relative path', () => {
			buildResetUrl('/reset-password', TOKEN);
			expect(mockLoggerWarn).not.toHaveBeenCalled();
		});
	});

	describe('non-URL / empty callbackURL', () => {
		// With base resolution these no longer throw; they land on a path of the
		// trusted origin, which is safe — the origin allowlist is the real guard.
		it('resolves a bare string to a path on the allowed origin', () => {
			const result = buildResetUrl('not-a-url', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});

		it('resolves an empty string to the base origin', () => {
			const result = buildResetUrl('', TOKEN);
			const url = new URL(result);
			expect(url.origin).toBe(ALLOWED_ORIGIN);
			expect(url.searchParams.get('token')).toBe(TOKEN);
		});
	});

	describe('untrusted origin', () => {
		it('throws for an attacker-controlled origin', () => {
			expect(() => buildResetUrl('https://evil.example.com/steal', TOKEN)).toThrow(
				'Untrusted callbackURL origin: https://evil.example.com'
			);
		});

		it('throws for a protocol-relative URL pointing at a foreign host', () => {
			expect(() => buildResetUrl('//evil.example.com/steal', TOKEN)).toThrow(
				'Untrusted callbackURL origin: https://evil.example.com'
			);
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				'Password reset blocked: untrusted callbackURL origin',
				{ origin: 'https://evil.example.com' }
			);
		});

		it('throws for an origin that only partially matches the allowlist', () => {
			expect(() =>
				buildResetUrl('https://sheppakai-mealplanner.fly.dev.evil.com/reset', TOKEN)
			).toThrow('Untrusted callbackURL origin');
		});

		it('throws for http variant of the production origin', () => {
			expect(() =>
				buildResetUrl('http://sheppakai-mealplanner.fly.dev/reset-password', TOKEN)
			).toThrow('Untrusted callbackURL origin: http://sheppakai-mealplanner.fly.dev');
		});

		it('calls logger.warn with the blocked origin', () => {
			try {
				buildResetUrl('https://evil.example.com/steal', TOKEN);
			} catch {
				// expected
			}
			expect(mockLoggerWarn).toHaveBeenCalledWith(
				'Password reset blocked: untrusted callbackURL origin',
				{ origin: 'https://evil.example.com' }
			);
		});
	});
});

describe('isResetTokenValid', () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
	});

	it('returns true when a matching, unexpired verification row exists', async () => {
		mockFindFirst.mockResolvedValue({
			identifier: 'reset-password:abc123resettoken',
			expiresAt: new Date(Date.now() + 60_000)
		});

		await expect(isResetTokenValid('abc123resettoken')).resolves.toBe(true);
		expect(mockFindFirst).toHaveBeenCalledWith({
			where: {
				type: 'eq',
				field: 'verification.identifier',
				value: 'reset-password:abc123resettoken'
			}
		});
	});

	it('returns false when no verification row exists', async () => {
		mockFindFirst.mockResolvedValue(undefined);

		await expect(isResetTokenValid('missing-token')).resolves.toBe(false);
	});

	it('returns false when the verification row has expired', async () => {
		mockFindFirst.mockResolvedValue({
			identifier: 'reset-password:expired-token',
			expiresAt: new Date(Date.now() - 60_000)
		});

		await expect(isResetTokenValid('expired-token')).resolves.toBe(false);
	});
});
