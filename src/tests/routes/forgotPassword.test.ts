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

import { actions } from '../../routes/(auth)/forgot-password/+page.server';

const GENERIC_RESULT = 'If an account exists for that email, a password reset link is on its way.';

function forgotRequest(email: string) {
	return new Request('https://example.com/forgot-password', {
		method: 'POST',
		body: new URLSearchParams({ email })
	});
}

describe('forgot-password default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks Better Auth to send a reset link for a valid email', async () => {
		handlerMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: true })));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(handlerMock).toHaveBeenCalledOnce();
		const [request] = handlerMock.mock.calls[0];
		expect(request.method).toBe('POST');
		expect(new URL(request.url).pathname).toBe('/api/auth/request-password-reset');
		expect(await request.json()).toEqual({
			email: 'user@example.com',
			redirectTo: '/reset-password'
		});
		expect(result).toMatchObject({ form: { message: GENERIC_RESULT } });
	});

	it('does not call Better Auth for an invalid email', async () => {
		const result = await actions.default({ request: forgotRequest('not-an-email') } as never);

		expect(handlerMock).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns the same generic message (not an error) when Better Auth fails', async () => {
		handlerMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

		const result = await actions.default({ request: forgotRequest('user@example.com') } as never);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send password reset email',
			expect.objectContaining({ message: 'Password reset request failed with status 503' }),
			{ email: 'user@example.com' }
		);
		expect(result).toMatchObject({ status: 500 });
		expect(result).toMatchObject({ data: { form: { message: GENERIC_RESULT } } });
	});
});
