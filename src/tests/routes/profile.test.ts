import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, loggerMock, emailMock, rateLimitCheckMock } = vi.hoisted(() => ({
	apiMock: {
		updateUser: vi.fn<() => Promise<unknown>>(),
		changePassword: vi.fn<() => Promise<unknown>>()
	},
	loggerMock: {
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	},
	emailMock: {
		sendPasswordChangedEmail: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined)
	},
	rateLimitCheckMock: vi.fn<() => Promise<{ limited: boolean; retryAfter: number }>>()
}));

vi.mock('$lib/server/auth', () => ({ auth: { api: apiMock } }));
vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));
vi.mock('$lib/server/email', () => emailMock);
vi.mock('$lib/server/rate-limiter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/rate-limiter')>();
	return {
		...actual,
		createUserRateLimiter: () => ({ check: rateLimitCheckMock })
	};
});

import { actions, load } from '../../routes/(app)/profile/+page.server';

const USER = { id: 'user_1', name: 'Alice', email: 'alice@example.com', role: 'user' };

function req(fields: Record<string, string>) {
	return new Request('https://example.com/profile', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

type Locals = Partial<App.Locals>;
const ctx = (locals: Locals, fields: Record<string, string>) =>
	({ request: req(fields), locals }) as never;

// `load` is auto-wrapped by @sentry/sveltekit, which reads `event.request` / `event.route`.
const loadCtx = (locals: Locals) =>
	({
		locals,
		request: new Request('https://example.com/profile'),
		route: { id: '/(app)/profile' }
	}) as never;

class FakeAuthError extends Error {
	body: { code: string };
	constructor(code: string, message: string) {
		super(message);
		this.body = { code };
	}
}

beforeEach(() => {
	vi.clearAllMocks();
	rateLimitCheckMock.mockResolvedValue({ limited: false, retryAfter: 0 });
});

describe('profile load', () => {
	it('returns the user with pre-filled name and password forms', async () => {
		const result = await load(loadCtx({ user: USER as App.Locals['user'] }));

		expect(result).toMatchObject({
			user: USER,
			nameForm: { data: { name: 'Alice' } },
			passwordForm: {
				data: { currentPassword: '', newPassword: '', confirmPassword: '' }
			}
		});
	});
});

describe('updateName action', () => {
	it('returns fail(401) when unauthenticated', async () => {
		const result = await actions.updateName(ctx({ user: null }, { name: 'Bob' }));
		expect(result).toMatchObject({ status: 401 });
		expect(apiMock.updateUser).not.toHaveBeenCalled();
	});

	it('rejects a name that is too short without calling the API', async () => {
		const result = await actions.updateName(
			ctx({ user: USER as App.Locals['user'] }, { name: 'A' })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.updateUser).not.toHaveBeenCalled();
	});

	it('calls auth.api.updateUser with the new name on success', async () => {
		apiMock.updateUser.mockResolvedValueOnce({});
		const result = await actions.updateName(
			ctx({ user: USER as App.Locals['user'] }, { name: 'Bob' })
		);

		expect(apiMock.updateUser).toHaveBeenCalledWith(
			expect.objectContaining({ body: { name: 'Bob' } })
		);
		expect(result).toMatchObject({
			form: { message: { type: 'success', text: 'Name updated.' } }
		});
	});

	it('returns a form error and logs when the API call fails', async () => {
		apiMock.updateUser.mockRejectedValueOnce(new Error('boom'));
		const result = await actions.updateName(
			ctx({ user: USER as App.Locals['user'] }, { name: 'Bob' })
		);

		expect(loggerMock.error).toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 400,
			data: { form: { message: { type: 'error' } } }
		});
	});
});

describe('changePassword action', () => {
	const validFields = {
		currentPassword: 'old-password-1',
		newPassword: 'brand-new-secret',
		confirmPassword: 'brand-new-secret'
	};

	it('returns fail(401) when unauthenticated', async () => {
		const result = await actions.changePassword(ctx({ user: null }, validFields));
		expect(result).toMatchObject({ status: 401 });
		expect(apiMock.changePassword).not.toHaveBeenCalled();
	});

	it('rejects mismatched passwords without calling the API', async () => {
		const result = await actions.changePassword(
			ctx({ user: USER as App.Locals['user'] }, { ...validFields, confirmPassword: 'different' })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.changePassword).not.toHaveBeenCalled();
	});

	it('returns 429 and skips the API call when rate limited', async () => {
		rateLimitCheckMock.mockResolvedValueOnce({ limited: true, retryAfter: 42 });

		const result = await actions.changePassword(
			ctx({ user: USER as App.Locals['user'] }, validFields)
		);

		expect(apiMock.changePassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 429,
			data: { form: { message: { text: 'Too many attempts. Please try again in 42 seconds.' } } }
		});
	});

	it('changes the password, revokes other sessions, and sends the notification email', async () => {
		apiMock.changePassword.mockResolvedValueOnce({});

		const result = await actions.changePassword(
			ctx({ user: USER as App.Locals['user'] }, validFields)
		);

		expect(apiMock.changePassword).toHaveBeenCalledWith(
			expect.objectContaining({
				body: {
					currentPassword: 'old-password-1',
					newPassword: 'brand-new-secret',
					revokeOtherSessions: true
				}
			})
		);
		expect(emailMock.sendPasswordChangedEmail).toHaveBeenCalledWith(
			expect.objectContaining({ to: USER.email, source: 'Profile settings' })
		);
		expect(result).toMatchObject({
			form: { message: { type: 'success', text: 'Password changed successfully.' } }
		});
	});

	it('surfaces an incorrect current password as a form error, not a thrown exception', async () => {
		apiMock.changePassword.mockRejectedValueOnce(
			new FakeAuthError('INVALID_PASSWORD', 'The password you entered is incorrect.')
		);

		const result = await actions.changePassword(
			ctx({ user: USER as App.Locals['user'] }, validFields)
		);

		expect(result).toMatchObject({
			status: 400,
			data: {
				form: {
					message: { type: 'error', text: 'The password you entered is incorrect.' }
				}
			}
		});
		expect(emailMock.sendPasswordChangedEmail).not.toHaveBeenCalled();
	});
});
