import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
	fetch: vi.fn<(input: string, init?: RequestInit) => Promise<unknown>>(),
	loggerError: vi.fn<() => void>(),
	loggerInfo: vi.fn<() => void>(),
	authAlertsUrl: 'https://alerts.example.com/auth'
}));

vi.mock('$app/env/private', () => ({
	// getter so a test can point the module at a different URL mid-suite
	get AUTH_ALERTS_URL() {
		return mockState.authAlertsUrl;
	}
}));

vi.mock('../../lib/server/logger', () => ({
	logger: {
		error: mockState.loggerError,
		info: mockState.loggerInfo
	}
}));

// Stub global fetch before the module under test is imported.
vi.stubGlobal('fetch', mockState.fetch);

import { sendAuthAlerts } from '../../lib/server/notifications';

describe('sendAuthAlerts', () => {
	beforeEach(() => {
		mockState.fetch.mockReset();
		mockState.loggerError.mockReset();
		mockState.loggerInfo.mockReset();
		mockState.authAlertsUrl = 'https://alerts.example.com/auth';
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns true when fetch responds ok', async () => {
		mockState.fetch.mockResolvedValue({ ok: true });
		await expect(sendAuthAlerts('User signed in')).resolves.toBe(true);
	});

	it('posts the message body to AUTH_ALERTS_URL', async () => {
		mockState.fetch.mockResolvedValue({ ok: true });
		await sendAuthAlerts('message');
		expect(mockState.fetch).toHaveBeenCalledWith(
			'https://alerts.example.com/auth',
			expect.objectContaining({ method: 'POST', body: 'message' })
		);
	});

	it('sends the supplied title, priority and tags headers', async () => {
		mockState.fetch.mockResolvedValue({ ok: true });
		await sendAuthAlerts('msg', 'Title', 5);
		const [, opts] = mockState.fetch.mock.calls[0] as [
			string,
			RequestInit & { headers: Record<string, string> }
		];
		expect(opts.headers).toMatchObject({ Title: 'Title', Priority: '5', Tags: 'rotating_light' });
	});

	it('uses default title and priority when not supplied', async () => {
		mockState.fetch.mockResolvedValue({ ok: true });
		await sendAuthAlerts('msg');
		const [, opts] = mockState.fetch.mock.calls[0] as [
			string,
			RequestInit & { headers: Record<string, string> }
		];
		expect(opts.headers).toMatchObject({ Title: 'App Alert', Priority: '3' });
	});

	it('returns false when the response is not ok', async () => {
		mockState.fetch.mockResolvedValue({ ok: false });
		await expect(sendAuthAlerts('fail')).resolves.toBe(false);
	});

	it('returns false and logs when fetch throws', async () => {
		mockState.fetch.mockRejectedValue(new Error('network error'));
		await expect(sendAuthAlerts('fail')).resolves.toBe(false);
		expect(mockState.loggerError).toHaveBeenCalled();
	});

	it('fails closed for the default .invalid host — never POSTs the alert', async () => {
		mockState.authAlertsUrl = 'https://auth-alerts.invalid';
		await expect(sendAuthAlerts('Password reset for a@b.com')).resolves.toBe(false);
		expect(mockState.fetch).not.toHaveBeenCalled();
		expect(mockState.loggerInfo).toHaveBeenCalled();
	});

	it('also skips a bare `invalid` host and any `*.invalid` subdomain', async () => {
		for (const url of ['https://invalid', 'https://x.y.invalid/path']) {
			mockState.authAlertsUrl = url;
			await expect(sendAuthAlerts('msg')).resolves.toBe(false);
		}
		expect(mockState.fetch).not.toHaveBeenCalled();
	});

	it('returns false and logs when AUTH_ALERTS_URL is not a valid URL', async () => {
		mockState.authAlertsUrl = 'not a url';
		await expect(sendAuthAlerts('msg')).resolves.toBe(false);
		expect(mockState.fetch).not.toHaveBeenCalled();
		expect(mockState.loggerError).toHaveBeenCalled();
	});
});
