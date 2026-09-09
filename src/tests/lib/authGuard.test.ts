import { getUser, requireAdmin, requireAuth } from '$lib/server/actions/auth-guard';
import type { RequestEvent } from '@sveltejs/kit';
import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';

function makeLocals(overrides: Partial<App.Locals> = {}): App.Locals {
	return {
		user: null,
		session: null,
		requestId: 'test-request-id',
		...overrides
	} as App.Locals;
}

function makeEvent(overrides: Partial<App.Locals> = {}): RequestEvent {
	return { locals: makeLocals(overrides) } as unknown as RequestEvent;
}

const mockUser = {
	id: 'user_123',
	name: 'Alice',
	email: 'alice@example.com',
	role: 'user'
} as App.Locals['user'];
const mockAdmin = {
	id: 'admin_123',
	name: 'Admin',
	email: 'admin@example.com',
	role: 'admin'
} as App.Locals['user'];

describe('requireAuth', () => {
	it('returns fail(401) when unauthenticated', async () => {
		const wrapped = requireAuth(async () => ({ ok: true }));
		expect(await wrapped(makeEvent())).toMatchObject({ status: 401 });
	});

	it('calls the handler with the authenticated user', async () => {
		const handler = vi.fn<() => Promise<{ ok: boolean }>>().mockResolvedValue({ ok: true });
		const wrapped = requireAuth(handler);

		const result = await wrapped(makeEvent({ user: mockUser }));

		expect(handler).toHaveBeenCalledOnce();
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({ locals: expect.anything() }),
			mockUser
		);
		expect(result).toEqual({ ok: true });
	});
});

describe('requireAdmin', () => {
	it('returns fail(401) when unauthenticated', async () => {
		const wrapped = requireAdmin(async () => ({ ok: true }));
		expect(await wrapped(makeEvent())).toMatchObject({ status: 401 });
	});

	it('returns fail(403) when authenticated but not an admin', async () => {
		const wrapped = requireAdmin(async () => ({ ok: true }));
		expect(await wrapped(makeEvent({ user: mockUser }))).toMatchObject({ status: 403 });
	});

	it('calls the handler when the user is an admin', async () => {
		const handler = vi.fn<() => Promise<{ ok: boolean }>>().mockResolvedValue({ ok: true });
		const wrapped = requireAdmin(handler);

		const result = await wrapped(makeEvent({ user: mockAdmin }));

		expect(handler).toHaveBeenCalledOnce();
		expect(result).toEqual({ ok: true });
	});
});

describe('getUser', () => {
	it('returns the user from locals when authenticated', () => {
		expect(getUser(makeLocals({ user: mockUser }))).toBe(mockUser);
	});

	it('throws a redirect to /sign-in when the user is missing', () => {
		let caught: unknown;
		try {
			getUser(makeLocals({ user: null }));
		} catch (e) {
			caught = e;
		}

		expect(isRedirect(caught)).toBe(true);
		expect((caught as { location: string }).location).toBe('/sign-in');
	});
});
