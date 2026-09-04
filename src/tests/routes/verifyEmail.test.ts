import { describe, it, expect, beforeEach, vi } from 'vitest';

const { handlerMock, loggerMock } = vi.hoisted(() => ({
	handlerMock: vi.fn<(request: Request) => Promise<Response>>(),
	loggerMock: { error: vi.fn<() => void>() }
}));

vi.mock('$lib/server/auth', () => ({
	auth: {
		handler: handlerMock,
		api: {
			getSession: vi.fn<() => Promise<null>>()
		}
	}
}));

vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

import { actions } from '../../routes/(auth)/verify-email/+page.server';

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
		handlerMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: true })));

		const result = await actions.resend({ request: resendRequest('user@example.com') } as never);

		expect(handlerMock).toHaveBeenCalledOnce();
		const [request] = handlerMock.mock.calls[0];
		expect(request.method).toBe('POST');
		expect(new URL(request.url).pathname).toBe('/api/auth/send-verification-email');
		expect(await request.json()).toEqual({ email: 'user@example.com' });
		expect(result).toMatchObject({
			form: { message: 'If an unverified account exists, a fresh verification link is on its way.' }
		});
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.resend({ request: resendRequest('not-an-email') } as never);

		expect(handlerMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns a generic error when Better Auth cannot send the email', async () => {
		handlerMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

		const result = await actions.resend({ request: resendRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to resend verification email',
			expect.objectContaining({ message: 'Verification email request failed with status 503' }),
			{ email: 'user@example.com' }
		);
		expect(result).toMatchObject({ status: 500 });
	});
});
