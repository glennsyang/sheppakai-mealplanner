import { describe, it, expect, beforeEach, vi } from 'vitest';

const { resetPasswordMock, loggerMock } = vi.hoisted(() => ({
	resetPasswordMock: vi.fn<() => Promise<unknown>>(),
	loggerMock: { warn: vi.fn<() => void>() }
}));

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn<() => Promise<null>>(),
			resetPassword: resetPasswordMock
		}
	}
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

import { actions } from '../../routes/(auth)/reset-password/+page.server';

function resetRequest(fields: Record<string, string>) {
	return new Request('https://example.com/reset-password', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

const validFields = {
	token: 'reset-token-123',
	password: 'brand-new-secret',
	confirmPassword: 'brand-new-secret'
};

describe('reset-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resets the password and redirects to login on success', async () => {
		resetPasswordMock.mockResolvedValueOnce({ status: true });

		let redirectError: unknown;
		try {
			await actions.default({ request: resetRequest(validFields) } as never);
		} catch (error) {
			redirectError = error;
		}

		expect(resetPasswordMock).toHaveBeenCalledWith(
			expect.objectContaining({
				body: { token: 'reset-token-123', newPassword: 'brand-new-secret' }
			})
		);
		expect(redirectError).toMatchObject({ status: 302, location: '/login?reset=success' });
	});

	it('rejects a submission with no token', async () => {
		const { token, ...withoutToken } = validFields;
		void token;

		const result = await actions.default({ request: resetRequest(withoutToken) } as never);

		expect(resetPasswordMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects mismatched passwords without calling Better Auth', async () => {
		const result = await actions.default({
			request: resetRequest({ ...validFields, confirmPassword: 'different-secret' })
		} as never);

		expect(resetPasswordMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns a generic error and logs when the token is invalid or expired', async () => {
		resetPasswordMock.mockRejectedValueOnce(new Error('INVALID_TOKEN'));

		const result = await actions.default({ request: resetRequest(validFields) } as never);

		expect(loggerMock.warn).toHaveBeenCalledWith('Password reset failed', expect.any(Object));
		expect(result).toMatchObject({
			status: 400,
			data: { form: { message: 'This reset link is invalid or has expired. Request a new one.' } }
		});
	});
});
