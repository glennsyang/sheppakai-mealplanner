import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, loggerMock, emailMock, alertsMock } = vi.hoisted(() => ({
	emailMock: vi.fn<() => Promise<void>>(),
	alertsMock: vi.fn<() => Promise<boolean>>(),
	apiMock: {
		createUser: vi.fn<() => Promise<unknown>>(),
		getUser: vi.fn<() => Promise<unknown>>(),
		listUsers: vi.fn<() => Promise<unknown>>(),
		setRole: vi.fn<() => Promise<unknown>>(),
		banUser: vi.fn<() => Promise<unknown>>(),
		unbanUser: vi.fn<() => Promise<unknown>>(),
		removeUser: vi.fn<() => Promise<unknown>>()
	},
	loggerMock: {
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

vi.mock('$lib/server/auth', () => ({
	auth: { api: apiMock },
	allowedEmails: new Set(['admin@example.com', 'listed@example.com'])
}));
vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));
vi.mock('$lib/server/email', () => ({ sendAccountCreatedEmail: emailMock }));
vi.mock('$lib/server/notifications', () => ({ sendAuthAlerts: alertsMock }));
vi.mock('$app/env/private', () => ({
	BETTER_AUTH_BASE_URL: 'https://app.example.com'
}));

import { actions, load } from '../../routes/(app)/admin/+page.server';

const ADMIN = { id: 'admin_1', name: 'Admin', email: 'admin@example.com', role: 'admin' };
const PLAIN = { id: 'user_1', name: 'User', email: 'user@example.com', role: 'user' };
const TARGET_ID = 'user_2';

function req(fields: Record<string, string>) {
	return new Request('https://example.com/admin', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

type Locals = Partial<App.Locals>;
const ctx = (locals: Locals, fields: Record<string, string>) =>
	({ request: req(fields), locals }) as never;

// `load` is auto-wrapped by @sentry/sveltekit, which reads `event.url` / `event.route`.
const loadCtx = () =>
	({
		request: new Request('https://example.com/admin'),
		url: new URL('https://example.com/admin'),
		route: { id: '/(app)/admin' }
	}) as never;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('admin load', () => {
	it('returns the user list from auth.api.listUsers', async () => {
		apiMock.listUsers.mockResolvedValueOnce({ users: [PLAIN], total: 1 });

		const result = await load(loadCtx());

		expect(apiMock.listUsers).toHaveBeenCalledOnce();
		expect(result).toMatchObject({ users: [PLAIN], allowlistedIds: [] });
		expect(result).toHaveProperty('createForm');
	});

	it('falls back to an empty list and logs when the API throws', async () => {
		apiMock.listUsers.mockRejectedValueOnce(new Error('boom'));

		const result = await load(loadCtx());

		expect(result).toMatchObject({ users: [], allowlistedIds: [] });
		expect(loggerMock.error).toHaveBeenCalled();
	});
});

describe.each([
	['setRole', { userId: TARGET_ID, role: 'admin' }],
	['banUser', { userId: TARGET_ID }],
	['unbanUser', { userId: TARGET_ID }],
	['removeUser', { userId: TARGET_ID }],
	['createUser', { name: 'New', email: 'listed@example.com', role: 'user' }],
	['sendWelcomeEmail', { userId: TARGET_ID }]
] as const)('admin action %s — authorization', (name, fields) => {
	it('returns fail(401) when unauthenticated', async () => {
		const result = await actions[name](ctx({ user: null }, fields));
		expect(result).toMatchObject({ status: 401 });
		expect(apiMock.createUser).not.toHaveBeenCalled();
	});

	it('returns fail(403) for a non-admin', async () => {
		const result = await actions[name](ctx({ user: PLAIN as App.Locals['user'] }, fields));
		expect(result).toMatchObject({ status: 403 });
		expect(apiMock.createUser).not.toHaveBeenCalled();
		expect(emailMock).not.toHaveBeenCalled();
	});
});

describe('admin action happy paths', () => {
	it('setRole calls auth.api.setRole with the parsed body', async () => {
		apiMock.setRole.mockResolvedValueOnce({});
		const result = await actions.setRole(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID, role: 'admin' })
		);

		expect(result).toBeUndefined();
		expect(apiMock.setRole).toHaveBeenCalledWith(
			expect.objectContaining({ body: { userId: TARGET_ID, role: 'admin' } })
		);
	});

	it('banUser forwards an optional reason', async () => {
		apiMock.banUser.mockResolvedValueOnce({});
		await actions.banUser(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID, banReason: 'spam' })
		);

		expect(apiMock.banUser).toHaveBeenCalledWith(
			expect.objectContaining({ body: { userId: TARGET_ID, banReason: 'spam' } })
		);
	});

	it('unbanUser calls auth.api.unbanUser', async () => {
		apiMock.unbanUser.mockResolvedValueOnce({});
		await actions.unbanUser(ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID }));

		expect(apiMock.unbanUser).toHaveBeenCalledWith(
			expect.objectContaining({ body: { userId: TARGET_ID } })
		);
	});

	it('removeUser calls auth.api.removeUser', async () => {
		apiMock.removeUser.mockResolvedValueOnce({});
		await actions.removeUser(ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID }));

		expect(apiMock.removeUser).toHaveBeenCalledWith(
			expect.objectContaining({ body: { userId: TARGET_ID } })
		);
	});
});

describe('admin action self-target guards', () => {
	it('setRole rejects changing your own role', async () => {
		const result = await actions.setRole(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: ADMIN.id, role: 'user' })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.setRole).not.toHaveBeenCalled();
	});

	it('banUser rejects banning yourself', async () => {
		const result = await actions.banUser(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: ADMIN.id })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.banUser).not.toHaveBeenCalled();
	});

	it('removeUser rejects removing yourself', async () => {
		const result = await actions.removeUser(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: ADMIN.id })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.removeUser).not.toHaveBeenCalled();
	});
});

describe('admin action validation', () => {
	it('setRole rejects an unknown role', async () => {
		const result = await actions.setRole(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID, role: 'superuser' })
		);
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.setRole).not.toHaveBeenCalled();
	});

	it('removeUser rejects a missing userId', async () => {
		const result = await actions.removeUser(ctx({ user: ADMIN as App.Locals['user'] }, {}));
		expect(result).toMatchObject({ status: 400 });
		expect(apiMock.removeUser).not.toHaveBeenCalled();
	});

	it('returns fail(500) and logs at error for an unexpected throw', async () => {
		apiMock.setRole.mockRejectedValueOnce(new Error('network'));
		const result = await actions.setRole(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID, role: 'admin' })
		);
		expect(result).toMatchObject({ status: 500 });
		expect(loggerMock.error).toHaveBeenCalled();
	});

	it('surfaces a better-auth APIError with its status/message and logs at warn', async () => {
		const { APIError } = await import('better-auth/api');
		apiMock.banUser.mockRejectedValueOnce(
			new APIError('FORBIDDEN', { message: 'You are not allowed to ban users' })
		);
		const result = await actions.banUser(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID })
		);
		expect(result).toMatchObject({
			status: 403,
			data: { error: 'You are not allowed to ban users' }
		});
		expect(loggerMock.warn).toHaveBeenCalled();
		expect(loggerMock.error).not.toHaveBeenCalled();
	});
});

describe('admin action createUser', () => {
	const adminCtx = (fields: Record<string, string>) =>
		ctx({ user: ADMIN as App.Locals['user'] }, fields);

	type FormResult = {
		form: {
			valid: boolean;
			message?: App.Superforms.Message;
			errors: Record<string, string[]>;
		};
	};
	type FailResult = { status: number; data: FormResult };

	it('creates an allowlisted user with a random password and sends the welcome email', async () => {
		apiMock.createUser.mockResolvedValueOnce({ user: { id: 'new_1' } });
		emailMock.mockResolvedValueOnce();

		const result = (await actions.createUser(
			adminCtx({ name: 'Listed', email: 'Listed@Example.com', role: 'user' })
		)) as FormResult;

		const body = (apiMock.createUser.mock.calls[0] as unknown[])[0] as {
			body: { email: string; name: string; role: string; password: string };
		};
		expect(body.body).toMatchObject({
			email: 'listed@example.com',
			name: 'Listed',
			role: 'user'
		});
		expect(body.body.password.length).toBeGreaterThanOrEqual(32);
		expect(emailMock).toHaveBeenCalledWith('listed@example.com', 'Listed', {
			appUrl: 'https://app.example.com',
			forgotPasswordUrl: 'https://app.example.com/forgot-password',
			profileUrl: 'https://app.example.com/profile'
		});
		expect(alertsMock).toHaveBeenCalledOnce();
		expect(result.form.message?.type).toBe('success');
		// The generated password never reaches logs or alerts.
		const logged = JSON.stringify([loggerMock.info.mock.calls, alertsMock.mock.calls]);
		expect(logged).not.toContain(body.body.password);
		expect(loggerMock.info).toHaveBeenCalledWith(
			'Admin created user',
			expect.objectContaining({
				actorId: ADMIN.id,
				userId: 'new_1',
				emailSent: true
			})
		);
	});

	it('creates a non-allowlisted user without emailing and returns a warning', async () => {
		apiMock.createUser.mockResolvedValueOnce({ user: { id: 'new_2' } });

		const result = (await actions.createUser(
			adminCtx({ name: 'Other', email: 'other@example.com', role: 'user' })
		)) as FormResult;

		expect(apiMock.createUser).toHaveBeenCalledOnce();
		expect(emailMock).not.toHaveBeenCalled();
		expect(result.form.message?.type).toBe('warning');
		expect(result.form.message?.text).toContain('ALLOWED_EMAILS');
	});

	it('still reports the user as created when the welcome email fails', async () => {
		apiMock.createUser.mockResolvedValueOnce({ user: { id: 'new_3' } });
		emailMock.mockRejectedValueOnce(new Error('brevo down'));

		const result = (await actions.createUser(
			adminCtx({ name: 'Listed', email: 'listed@example.com', role: 'user' })
		)) as FormResult;

		expect(result.form.message?.type).toBe('warning');
		expect(result.form.message?.text).toContain('welcome email failed');
	});

	it('returns a 400 field error for a duplicate email', async () => {
		const { APIError } = await import('better-auth/api');
		apiMock.createUser.mockRejectedValueOnce(
			new APIError('BAD_REQUEST', {
				message: 'User already exists. Use another email.'
			})
		);

		const result = (await actions.createUser(
			adminCtx({ name: 'Dup', email: 'listed@example.com', role: 'user' })
		)) as FailResult;

		expect(result.status).toBe(400);
		expect(result.data.form.errors.email).toEqual(['User already exists. Use another email.']);
		expect(emailMock).not.toHaveBeenCalled();
		expect(alertsMock).not.toHaveBeenCalled();
	});

	it('returns 400 without calling the API for an invalid email', async () => {
		const result = (await actions.createUser(
			adminCtx({ name: 'Bad', email: 'nope', role: 'user' })
		)) as FailResult;

		expect(result.status).toBe(400);
		expect(apiMock.createUser).not.toHaveBeenCalled();
	});

	it('returns 500 and logs at error for an unexpected throw', async () => {
		apiMock.createUser.mockRejectedValueOnce(new Error('db locked'));

		const result = (await actions.createUser(
			adminCtx({ name: 'X', email: 'listed@example.com', role: 'user' })
		)) as FailResult;

		expect(result.status).toBe(500);
		expect(loggerMock.error).toHaveBeenCalled();
	});
});

describe('admin action sendWelcomeEmail', () => {
	it('sends the welcome email to an allowlisted user', async () => {
		apiMock.getUser.mockResolvedValueOnce({
			id: TARGET_ID,
			email: 'listed@example.com',
			name: 'Listed'
		});
		emailMock.mockResolvedValueOnce();

		const result = await actions.sendWelcomeEmail(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID })
		);

		expect(emailMock).toHaveBeenCalledWith('listed@example.com', 'Listed', expect.any(Object));
		expect(result).toEqual({
			success: 'Welcome email sent to listed@example.com.'
		});
	});

	it('refuses a user who is not allowlisted', async () => {
		apiMock.getUser.mockResolvedValueOnce({
			id: TARGET_ID,
			email: 'other@example.com',
			name: 'Other'
		});

		const result = await actions.sendWelcomeEmail(
			ctx({ user: ADMIN as App.Locals['user'] }, { userId: TARGET_ID })
		);

		expect(result).toMatchObject({ status: 400 });
		expect(emailMock).not.toHaveBeenCalled();
	});
});
