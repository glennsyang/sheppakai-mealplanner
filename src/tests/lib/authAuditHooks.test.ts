import { describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
	sendNewUserEmail: vi.fn<(to: string, name: string) => void>(),
	sendAuthAlerts: vi.fn<(message: string, title?: string, priority?: number) => void>(),
	loggerInfo: vi.fn<(message: string, meta?: unknown) => void>(),
	loggerDebug: vi.fn<(message: string) => void>()
}));

vi.mock('better-auth/api', () => ({
	// The real createAuthMiddleware wraps the callback in better-call's
	// middleware machinery — not worth mocking. The callback itself is what
	// this test exercises, so treat the wrapper as identity.
	createAuthMiddleware: (fn: unknown) => fn
}));

vi.mock('../../lib/server/email', () => ({ sendNewUserEmail: mockState.sendNewUserEmail }));
vi.mock('../../lib/server/notifications', () => ({ sendAuthAlerts: mockState.sendAuthAlerts }));
vi.mock('../../lib/server/logger', () => ({
	logger: { info: mockState.loggerInfo, debug: mockState.loggerDebug }
}));

import { createAuthAfterHooks, logPasswordResetAudit } from '../../lib/server/auth/audit-hooks';

type FakeCtx = {
	path: string;
	context: {
		newSession: { user: { email: string; name: string }; session: { ipAddress: string } } | null;
	};
};

function fakeCtx(overrides: Partial<FakeCtx> = {}): FakeCtx {
	return { path: '/unrelated', context: { newSession: null }, ...overrides };
}

describe('createAuthAfterHooks', () => {
	const afterHook = createAuthAfterHooks('Test App') as unknown as (ctx: FakeCtx) => Promise<void>;

	it('sends the welcome email and admin alert on /sign-up/email with a new session', async () => {
		await afterHook(
			fakeCtx({
				path: '/sign-up/email',
				context: {
					newSession: {
						user: { email: 'new@example.com', name: 'New User' },
						session: { ipAddress: '1.2.3.4' }
					}
				}
			})
		);

		expect(mockState.sendNewUserEmail).toHaveBeenCalledWith('new@example.com', 'New User');
		expect(mockState.sendAuthAlerts).toHaveBeenCalledWith(
			expect.stringContaining('new@example.com'),
			'Test App - New User Alert',
			4
		);
	});

	it('does nothing on /sign-up/email without a new session', async () => {
		await afterHook(fakeCtx({ path: '/sign-up/email' }));

		expect(mockState.sendNewUserEmail).not.toHaveBeenCalled();
		expect(mockState.sendAuthAlerts).not.toHaveBeenCalled();
	});

	it('logs the resolved email + IP on /sign-in/email with a new session', async () => {
		await afterHook(
			fakeCtx({
				path: '/sign-in/email',
				context: {
					newSession: {
						user: { email: 'user@example.com', name: 'User' },
						session: { ipAddress: '5.6.7.8' }
					}
				}
			})
		);

		expect(mockState.loggerInfo).toHaveBeenCalledWith(
			expect.stringContaining('Sign-in'),
			expect.objectContaining({ email: 'user@example.com', ip: '5.6.7.8' })
		);
	});

	it('does not fire on an unrelated path', async () => {
		await afterHook(fakeCtx({ path: '/reset-password' }));

		expect(mockState.sendNewUserEmail).not.toHaveBeenCalled();
		expect(mockState.sendAuthAlerts).not.toHaveBeenCalled();
		expect(mockState.loggerInfo).not.toHaveBeenCalled();
	});

	it('does not match a path that merely contains the endpoint as a substring', async () => {
		// Regression guard for the original bug: `.includes('/register')` never
		// matched the real `/sign-up/email` endpoint. Exact-match must not
		// accidentally match a longer path either.
		await afterHook(fakeCtx({ path: '/sign-up/email/extra' }));

		expect(mockState.sendNewUserEmail).not.toHaveBeenCalled();
	});
});

describe('logPasswordResetAudit', () => {
	it('logs and alerts with the given user and app name', () => {
		logPasswordResetAudit({ id: 'user-1', email: 'reset@example.com' }, 'Test App');

		expect(mockState.loggerInfo).toHaveBeenCalledWith(
			expect.stringContaining('password reset completed'),
			expect.objectContaining({ userId: 'user-1', email: 'reset@example.com' })
		);
		expect(mockState.sendAuthAlerts).toHaveBeenCalledWith(
			expect.stringContaining('reset@example.com'),
			'Test App - Security Alert',
			4
		);
	});
});
