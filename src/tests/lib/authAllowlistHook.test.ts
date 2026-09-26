import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
	sendAuthAlerts: vi.fn<(message: string, title?: string, priority?: number) => void>()
}));

vi.mock('better-auth/api', async (importOriginal) => ({
	...(await importOriginal<typeof import('better-auth/api')>()),
	// Treat the middleware wrapper as identity so the callback can be called directly.
	createAuthMiddleware: (fn: unknown) => fn
}));

vi.mock('../../lib/server/notifications', () => ({
	sendAuthAlerts: mockState.sendAuthAlerts
}));

import {
	createAllowlistBeforeHook,
	createAllowlistSessionGuard,
	formatAlertEmail,
	isUserAccessAllowed,
	parseAllowedEmails
} from '../../lib/server/auth/allowlist-hook';

type FakeCtx = { path: string; body?: { email?: unknown } };

type FakeHook = (ctx: FakeCtx) => Promise<void>;

// A zero-length window disables debouncing so each test sees its own alert.
const hook = createAllowlistBeforeHook(
	'Test App',
	parseAllowedEmails(' Owner@Example.com , partner@example.com,, '),
	{ alertWindowMs: 0 }
) as unknown as FakeHook;

beforeEach(() => mockState.sendAuthAlerts.mockClear());

describe('parseAllowedEmails', () => {
	it('trims, lowercases and drops empty entries', () => {
		expect(parseAllowedEmails(' A@x.com,, b@X.com ')).toEqual(new Set(['a@x.com', 'b@x.com']));
		expect(parseAllowedEmails('').size).toBe(0);
	});
});

describe('createAllowlistBeforeHook', () => {
	it('allows sign-in for an allowlisted email, case-insensitively', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'OWNER@example.com ' } })
		).resolves.toBeUndefined();
		expect(mockState.sendAuthAlerts).not.toHaveBeenCalled();
	});

	it('rejects a lookalike email that merely contains an allowlisted address', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'x+owner@example.com' } })
		).rejects.toThrow('Invalid email or password');
		expect(mockState.sendAuthAlerts).toHaveBeenCalledWith(
			expect.stringContaining('x+owner@example.com'),
			'Test App - Security Alert',
			3
		);
	});

	it('rejects with the same error Better Auth uses for a wrong password', async () => {
		await expect(
			hook({ path: '/sign-in/email', body: { email: 'stranger@example.com' } })
		).rejects.toMatchObject({
			statusCode: 401,
			body: {
				code: 'INVALID_EMAIL_OR_PASSWORD',
				message: 'Invalid email or password'
			}
		});
	});

	it('rejects sign-up for a non-allowlisted email', async () => {
		await expect(
			hook({ path: '/sign-up/email', body: { email: 'stranger@example.com' } })
		).rejects.toThrow('Invalid email or password');
	});

	it('rejects a missing or non-string email', async () => {
		await expect(hook({ path: '/sign-in/email' })).rejects.toThrow('Invalid email or password');
		await expect(hook({ path: '/sign-in/email', body: { email: 42 } })).rejects.toThrow(
			'Invalid email or password'
		);
	});

	it('ignores unguarded paths', async () => {
		await expect(
			hook({ path: '/get-session', body: { email: 'stranger@example.com' } })
		).resolves.toBeUndefined();
	});
});

describe('formatAlertEmail', () => {
	it('passes through a well-formed email', () => {
		expect(formatAlertEmail('stranger@example.com')).toBe('stranger@example.com');
	});

	it('replaces an oversized multi-line value', () => {
		const huge = `Password reset completed for admin@example.com\n${'a'.repeat(10_000)}`;
		expect(formatAlertEmail(huge)).toBe('(invalid email)');
	});

	it('replaces values containing newlines or control characters', () => {
		expect(formatAlertEmail('a@b.com\nPassword reset completed')).toBe('(invalid email)');
		expect(formatAlertEmail('a\u0000b@example.com')).toBe('(invalid email)');
		expect(formatAlertEmail('not-an-email')).toBe('(invalid email)');
		expect(formatAlertEmail('a\u202eb@example.com')).toBe('(invalid email)');
	});

	it('marks a missing email', () => {
		expect(formatAlertEmail('')).toBe('(none)');
	});
});

describe('createAllowlistBeforeHook alert debounce', () => {
	const WINDOW_MS = 60_000;

	function createDebouncedHook() {
		let clock = 1_000_000;
		const debounced = createAllowlistBeforeHook(
			'Test App',
			parseAllowedEmails('owner@example.com'),
			{
				alertWindowMs: WINDOW_MS,
				now: () => clock
			}
		) as unknown as FakeHook;
		return {
			hook: debounced,
			advance: (ms: number) => {
				clock += ms;
			}
		};
	}

	const block = (h: FakeHook, email = 'stranger@example.com') =>
		expect(h({ path: '/sign-in/email', body: { email } })).rejects.toThrow(
			'Invalid email or password'
		);

	it('sends at most one alert per window', async () => {
		const { hook: debounced } = createDebouncedHook();
		for (let i = 0; i < 50; i++) {
			await block(debounced);
		}
		expect(mockState.sendAuthAlerts).toHaveBeenCalledTimes(1);
	});

	it('reports suppressed attempts with the next alert after the window', async () => {
		const { hook: debounced, advance } = createDebouncedHook();
		for (let i = 0; i < 50; i++) {
			await block(debounced);
		}
		advance(WINDOW_MS);
		await block(debounced);
		expect(mockState.sendAuthAlerts).toHaveBeenCalledTimes(2);
		expect(mockState.sendAuthAlerts.mock.lastCall?.[0]).toContain(
			'(+49 more suppressed since last alert)'
		);
	});

	it('does not count allowlisted sign-ins as suppressed attempts', async () => {
		const { hook: debounced, advance } = createDebouncedHook();
		await block(debounced);
		await debounced({
			path: '/sign-in/email',
			body: { email: 'owner@example.com' }
		});
		advance(WINDOW_MS);
		await block(debounced);
		expect(mockState.sendAuthAlerts.mock.lastCall?.[0]).not.toContain('suppressed');
	});

	it('shows a placeholder instead of an injected value', async () => {
		const { hook: debounced } = createDebouncedHook();
		await block(debounced, 'x@y.com\nPassword reset completed for admin@example.com');
		expect(mockState.sendAuthAlerts.mock.lastCall?.[0]).toContain('(invalid email)');
		expect(mockState.sendAuthAlerts.mock.lastCall?.[0]).not.toContain('Password reset');
	});
});

describe('createAllowlistSessionGuard', () => {
	const emails: Record<string, string> = {
		owner: 'Owner@Example.com',
		stranger: 'x@example.com'
	};
	const guard = createAllowlistSessionGuard(
		parseAllowedEmails('owner@example.com'),
		async (userId) => emails[userId]
	);

	it('allows a session for an allowlisted user, case-insensitively', async () => {
		await expect(guard({ userId: 'owner' })).resolves.toBeUndefined();
	});

	it('blocks a session for a non-allowlisted user (e.g. verify-email auto sign-in)', async () => {
		await expect(guard({ userId: 'stranger' })).rejects.toMatchObject({
			statusCode: 401,
			body: { code: 'INVALID_EMAIL_OR_PASSWORD' }
		});
	});

	it('blocks a session when the user cannot be found', async () => {
		await expect(guard({ userId: 'missing' })).rejects.toThrow('Invalid email or password');
	});
});

describe('isUserAccessAllowed', () => {
	const allowed = parseAllowedEmails('owner@example.com');

	it('allows an allowlisted, unbanned user regardless of case/whitespace', () => {
		expect(isUserAccessAllowed({ email: ' Owner@Example.COM ', banned: false }, allowed)).toBe(
			true
		);
	});

	it('rejects a user no longer on the allowlist', () => {
		expect(isUserAccessAllowed({ email: 'removed@example.com', banned: false }, allowed)).toBe(
			false
		);
	});

	it('rejects a banned user with no expiry', () => {
		expect(
			isUserAccessAllowed({ email: 'owner@example.com', banned: true, banExpires: null }, allowed)
		).toBe(false);
	});

	it('rejects a banned user whose ban has not expired yet', () => {
		const banExpires = new Date(Date.now() + 60_000);
		expect(
			isUserAccessAllowed({ email: 'owner@example.com', banned: true, banExpires }, allowed)
		).toBe(false);
	});

	it('allows a user whose ban has expired', () => {
		const banExpires = new Date(Date.now() - 60_000);
		expect(
			isUserAccessAllowed({ email: 'owner@example.com', banned: true, banExpires }, allowed)
		).toBe(true);
	});
});
