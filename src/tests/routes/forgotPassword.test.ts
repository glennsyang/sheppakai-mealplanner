import { describe, it, expect, beforeEach, vi } from 'vitest';

const { requestPasswordResetMock, loggerMock, rateLimitCheckMock } = vi.hoisted(() => ({
	requestPasswordResetMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
	loggerMock: { error: vi.fn<() => void>() },
	rateLimitCheckMock: vi.fn<() => Promise<{ limited: boolean; retryAfter: number }>>()
}));

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			requestPasswordReset: requestPasswordResetMock,
			getSession: vi.fn<() => Promise<null>>()
		}
	}
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

vi.mock('$lib/server/rate-limiter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/rate-limiter')>();
	return {
		...actual,
		createAuthRateLimiter: () => ({ check: rateLimitCheckMock })
	};
});

import { FORGOT_PASSWORD_RESPONSE } from '$lib/server/auth/forgot-password-response';

import { actions } from '../../routes/(auth)/forgot-password/+page.server';

const GENERIC_RESULT = FORGOT_PASSWORD_RESPONSE.text;

function forgotRequest(email: string) {
	return new Request('https://example.com/forgot-password', {
		method: 'POST',
		body: new URLSearchParams({ email })
	});
}

describe('forgot-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		rateLimitCheckMock.mockResolvedValue({ limited: false, retryAfter: 0 });
	});

	it('asks Better Auth to send a reset link for a valid email', async () => {
		requestPasswordResetMock.mockResolvedValueOnce({ status: true });

		const request = forgotRequest('user@example.com');
		const result = await actions.default({ request } as never);

		expect(requestPasswordResetMock).toHaveBeenCalledOnce();
		expect(requestPasswordResetMock).toHaveBeenCalledWith({
			body: { email: 'user@example.com', redirectTo: '/reset-password' },
			headers: request.headers
		});
		expect(result).toMatchObject({
			form: { message: { type: 'success', text: GENERIC_RESULT } }
		});
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.default({ request: forgotRequest('not-an-email') } as never);

		expect(requestPasswordResetMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns the same generic message (styled as success, not error) when Better Auth fails', async () => {
		requestPasswordResetMock.mockRejectedValueOnce(new Error('Password reset request failed'));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send password reset email',
			expect.objectContaining({ message: 'Password reset request failed' })
		);
		expect(result).toMatchObject({
			status: 400,
			data: { form: { message: { type: 'success', text: GENERIC_RESULT } } }
		});
	});

	it('returns a 429 with a retry-after message and skips Better Auth when rate limited', async () => {
		rateLimitCheckMock.mockResolvedValueOnce({ limited: true, retryAfter: 42 });

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(requestPasswordResetMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 429,
			data: {
				form: {
					message: { type: 'error', text: 'Too many attempts. Please try again in 42 seconds.' }
				}
			}
		});
	});
});
