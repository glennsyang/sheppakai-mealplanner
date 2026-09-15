import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sendVerificationEmailMock, loggerMock } = vi.hoisted(() => ({
	sendVerificationEmailMock: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
	loggerMock: { error: vi.fn<() => void>() }
}));

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			sendVerificationEmail: sendVerificationEmailMock,
			getSession: vi.fn<() => Promise<null>>()
		}
	}
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

import { actions } from '../../routes/(auth)/verify-email/+page.server';

const GENERIC_RESULT = 'If an unverified account exists, a fresh verification link is on its way.';

function resendRequest(email: string) {
	return new Request('https://example.com/verify-email?/resend', {
		method: 'POST',
		body: new URLSearchParams({ email })
	});
}

describe('verify-email resend action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks Better Auth to send a new link for a valid email', async () => {
		sendVerificationEmailMock.mockResolvedValueOnce({ status: true });

		const request = resendRequest('user@example.com');
		const result = await actions.resend({ request } as never);

		expect(sendVerificationEmailMock).toHaveBeenCalledOnce();
		expect(sendVerificationEmailMock).toHaveBeenCalledWith({
			body: { email: 'user@example.com' },
			headers: request.headers
		});
		expect(result).toMatchObject({
			form: { message: { type: 'success', text: GENERIC_RESULT } }
		});
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.resend({ request: resendRequest('not-an-email') } as never);

		expect(sendVerificationEmailMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns a generic error when Better Auth cannot send the email', async () => {
		sendVerificationEmailMock.mockRejectedValueOnce(new Error('Verification email request failed'));

		const result = await actions.resend({ request: resendRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to resend verification email',
			expect.objectContaining({ message: 'Verification email request failed' })
		);
		expect(result).toMatchObject({
			status: 400,
			data: {
				form: {
					message: {
						type: 'error',
						text: 'We could not send a verification email. Please try again shortly.'
					}
				}
			}
		});
	});
});
