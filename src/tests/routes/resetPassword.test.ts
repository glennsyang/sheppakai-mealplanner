import { describe, it, expect, beforeEach, vi } from 'vitest';

const { resetPasswordMock, loggerMock, isResetTokenValidMock } = vi.hoisted(() => ({
	resetPasswordMock: vi.fn<() => Promise<unknown>>(),
	loggerMock: { error: vi.fn<() => void>() },
	isResetTokenValidMock: vi.fn<() => Promise<boolean>>()
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

vi.mock('$lib/server/auth-reset-url', () => ({
	isResetTokenValid: isResetTokenValidMock
}));

import { actions, load } from '../../routes/(auth)/reset-password/+page.server';

function loadEvent(url: string) {
	return {
		locals: { user: null },
		url: new URL(url),
		request: new Request(url),
		route: { id: '/(auth)/reset-password' }
	} as never;
}

function resetRequest(fields: Record<string, string>) {
	return new Request('https://example.com/reset-password', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

const validFields = {
	token: 'reset-token-123',
	password: 'Brand-New-Secret1!',
	confirmPassword: 'Brand-New-Secret1!'
};

describe('reset-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resets the password and redirects to sign-in on success', async () => {
		resetPasswordMock.mockResolvedValueOnce({ status: true });

		let redirectError: unknown;
		try {
			await actions.default({ request: resetRequest(validFields) } as never);
		} catch (error) {
			redirectError = error;
		}

		expect(resetPasswordMock).toHaveBeenCalledWith(
			expect.objectContaining({
				body: { token: 'reset-token-123', newPassword: 'Brand-New-Secret1!' }
			})
		);
		expect(redirectError).toMatchObject({ status: 302, location: '/sign-in?reset=success' });
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

		expect(loggerMock.error).toHaveBeenCalledWith('Password reset failed', expect.any(Error));
		expect(result).toMatchObject({
			status: 400,
			data: {
				form: {
					message: {
						type: 'error',
						text: 'This reset link is invalid or has expired. Request a new one.'
					}
				}
			}
		});
	});
});

describe('reset-password load', () => {
	beforeEach(() => {
		isResetTokenValidMock.mockReset();
	});

	it('marks the token invalid when the token param is missing', async () => {
		const result = await load(loadEvent('https://example.com/reset-password'));

		expect(isResetTokenValidMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ token: null, invalid: true });
	});

	it('marks the token invalid when the verification row is expired or missing', async () => {
		isResetTokenValidMock.mockResolvedValue(false);

		const result = await load(loadEvent('https://example.com/reset-password?token=bad'));

		expect(isResetTokenValidMock).toHaveBeenCalledWith('bad');
		expect(result).toMatchObject({ token: 'bad', invalid: true });
	});

	it('marks the token valid when a live verification row exists', async () => {
		isResetTokenValidMock.mockResolvedValue(true);

		const result = await load(loadEvent('https://example.com/reset-password?token=good'));

		expect(result).toMatchObject({ token: 'good', invalid: false });
	});
});
