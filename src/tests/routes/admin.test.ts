import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, loggerMock } = vi.hoisted(() => ({
	apiMock: {
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

vi.mock('$lib/server/auth', () => ({ auth: { api: apiMock } }));
vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

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
		expect(result).toEqual({ users: [PLAIN] });
	});

	it('falls back to an empty list and logs when the API throws', async () => {
		apiMock.listUsers.mockRejectedValueOnce(new Error('boom'));

		const result = await load(loadCtx());

		expect(result).toEqual({ users: [] });
		expect(loggerMock.error).toHaveBeenCalled();
	});
});

describe.each([
	['setRole', { userId: TARGET_ID, role: 'admin' }],
	['banUser', { userId: TARGET_ID }],
	['unbanUser', { userId: TARGET_ID }],
	['removeUser', { userId: TARGET_ID }]
] as const)('admin action %s — authorization', (name, fields) => {
	it('returns fail(401) when unauthenticated', async () => {
		const result = await actions[name](ctx({ user: null }, fields));
		expect(result).toMatchObject({ status: 401 });
	});

	it('returns fail(403) for a non-admin', async () => {
		const result = await actions[name](ctx({ user: PLAIN as App.Locals['user'] }, fields));
		expect(result).toMatchObject({ status: 403 });
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
