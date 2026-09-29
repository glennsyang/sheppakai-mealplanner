import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/sveltekit', () => ({
	captureException: vi.fn<() => void>(),
	captureMessage: vi.fn<() => void>()
}));

describe('logger', () => {
	let debugSpy: ReturnType<typeof vi.spyOn>;
	let infoSpy: ReturnType<typeof vi.spyOn>;
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
		infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		debugSpy.mockRestore();
		infoSpy.mockRestore();
		warnSpy.mockRestore();
		errorSpy.mockRestore();
		delete process.env.NODE_ENV;
		delete process.env.LOG_LEVEL;
		vi.clearAllMocks();
	});

	function lastEntry(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
		const call = spy.mock.calls.at(-1);
		return JSON.parse(String(call?.[0])) as Record<string, unknown>;
	}

	it('always writes structured JSON, in both dev and prod', async () => {
		vi.resetModules();
		const { logger } = await import('../lib/server/logger');
		logger.info('hello', { foo: 'bar' });
		const entry = lastEntry(infoSpy);
		expect(entry.level).toBe('info');
		expect(entry.message).toBe('hello');
		expect(entry.foo).toBe('bar');
		expect(typeof entry.timestamp).toBe('string');
	});

	describe('level filtering via LOG_LEVEL', () => {
		it('defaults to debug in dev — all levels are logged', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');
			expect(debugSpy).toHaveBeenCalledTimes(1);
			expect(infoSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		it('defaults to info in production — debug is suppressed', async () => {
			vi.resetModules();
			process.env.NODE_ENV = 'production';
			const { logger } = await import('../lib/server/logger');
			logger.debug('d');
			logger.info('i');
			expect(debugSpy).not.toHaveBeenCalled();
			expect(infoSpy).toHaveBeenCalledTimes(1);
		});

		it('honors an explicit LOG_LEVEL override', async () => {
			vi.resetModules();
			process.env.LOG_LEVEL = 'warn';
			const { logger } = await import('../lib/server/logger');
			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');
			expect(debugSpy).not.toHaveBeenCalled();
			expect(infoSpy).not.toHaveBeenCalled();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe('PII stripping in production', () => {
		it('strips PII fields from meta in production', async () => {
			vi.resetModules();
			process.env.NODE_ENV = 'production';
			const { logger } = await import('../lib/server/logger');
			logger.info('user event', {
				userId: 'u1',
				id: 'row1',
				email: 'a@b.com',
				password: 'secret',
				token: 'tok',
				createdBy: 'u1',
				updatedBy: 'u1',
				ip: '203.0.113.7',
				ipAddress: '198.51.100.9',
				userAgent: 'Mozilla/5.0',
				safeField: 'keep-me'
			});
			const entry = lastEntry(infoSpy);
			expect(entry.userId).toBeUndefined();
			expect(entry.id).toBeUndefined();
			expect(entry.email).toBeUndefined();
			expect(entry.password).toBeUndefined();
			expect(entry.token).toBeUndefined();
			expect(entry.createdBy).toBeUndefined();
			expect(entry.updatedBy).toBeUndefined();
			expect(entry.ip).toBeUndefined();
			expect(entry.ipAddress).toBeUndefined();
			expect(entry.userAgent).toBeUndefined();
			expect(entry.safeField).toBe('keep-me');
		});

		it('keeps PII fields intact in dev', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.info('user event', { userId: 'u1', safeField: 'keep-me' });
			const entry = lastEntry(infoSpy);
			expect(entry.userId).toBe('u1');
			expect(entry.safeField).toBe('keep-me');
		});

		it('strips PII fields carried in child() context too', async () => {
			vi.resetModules();
			process.env.NODE_ENV = 'production';
			const { logger } = await import('../lib/server/logger');
			const requestLogger = logger.child({ requestId: 'req-1', userId: 'u1' });
			requestLogger.info('context test');
			const entry = lastEntry(infoSpy);
			expect(entry.requestId).toBe('req-1');
			expect(entry.userId).toBeUndefined();
		});
	});

	describe('child() context inheritance', () => {
		it('merges child context into every subsequent log', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			const child = logger.child({ requestId: 'req-1', method: 'GET' });
			child.info('first');
			child.warn('second');
			expect(lastEntry(infoSpy).requestId).toBe('req-1');
			expect(lastEntry(infoSpy).method).toBe('GET');
			const warnEntry = lastEntry(warnSpy);
			expect(warnEntry.requestId).toBe('req-1');
			expect(warnEntry.method).toBe('GET');
		});

		it('does not mutate the parent logger and returns a new instance', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			const child = logger.child({ requestId: 'req-1' });
			expect(child).not.toBe(logger);
			logger.info('on parent');
			expect(lastEntry(infoSpy).requestId).toBeUndefined();
		});

		it('grandchild context overrides and extends parent context', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			const child = logger.child({ requestId: 'req-1', userId: 'anon' });
			const grandchild = child.child({ userId: 'u42' });
			grandchild.info('nested');
			const entry = lastEntry(infoSpy);
			expect(entry.requestId).toBe('req-1');
			expect(entry.userId).toBe('u42');
		});
	});

	describe('error() second argument', () => {
		it('accepts an Error instance', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.error('boom', new Error('bad thing'));
			const entry = lastEntry(errorSpy);
			const err = entry.error as Record<string, unknown>;
			expect(err.name).toBe('Error');
			expect(err.message).toBe('bad thing');
		});

		it('accepts a string', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.error('boom', 'string reason');
			const entry = lastEntry(errorSpy);
			expect(entry.error).toBe('string reason');
		});

		it('accepts no error argument at all', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.error('boom');
			const entry = lastEntry(errorSpy);
			expect(entry.error).toBeUndefined();
			expect(entry.message).toBe('boom');
		});

		it('still accepts meta as the third argument alongside an Error', async () => {
			vi.resetModules();
			const { logger } = await import('../lib/server/logger');
			logger.error('boom', new Error('bad thing'), { requestId: 'req-1' });
			const entry = lastEntry(errorSpy);
			expect(entry.requestId).toBe('req-1');
		});
	});

	describe('free-text PII redaction in production', () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NODE_ENV = 'production';
		});

		it('redacts an email address embedded in an Error message', async () => {
			const { logger } = await import('../lib/server/logger');
			logger.error('Failed operation', new Error('Failed for a@b.com'));
			const line = errorSpy.mock.calls.at(-1)?.[0] as string;
			expect(line).not.toContain('a@b.com');
			expect(line).toContain('[redacted]');
		});

		it('redacts a JWT-shaped token embedded in an Error message', async () => {
			const { logger } = await import('../lib/server/logger');
			const fakeJwt =
				'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dQw4w9WgXcQrRZ4rV9v9v9v9v9v9v9v9v9v9v9v9v9v';
			logger.error('Token error', new Error(`Bad token: ${fakeJwt}`));
			const line = errorSpy.mock.calls.at(-1)?.[0] as string;
			expect(line).not.toContain(fakeJwt);
		});

		it('redacts PII in the message and in string meta values', async () => {
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			logger.warn('Email to a@b.com bounced', { recipient: 'c@d.com' });
			const line = warnSpy.mock.calls.at(-1)?.[0] as string;
			expect(line).not.toContain('a@b.com');
			expect(line).not.toContain('c@d.com');
			expect(vi.mocked(sentry.captureMessage).mock.calls[0]?.[0]).not.toContain('a@b.com');
		});

		it('redacts PII in the Error object handed to Sentry', async () => {
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			logger.error('Failed operation', new Error('Failed for a@b.com'));
			const [sentryError] = vi.mocked(sentry.captureException).mock.calls[0] as unknown as [Error];
			expect(sentryError.message).not.toContain('a@b.com');
		});

		it('strips PII from a non-Error payload handed to Sentry', async () => {
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			logger.error('Failed operation', { userId: 'u1', detail: 'x', note: 'Failed for a@b.com' });
			const [, options] = vi.mocked(sentry.captureMessage).mock.calls[0] as unknown as [
				string,
				{ extra: { error: Record<string, unknown> } }
			];
			expect(options.extra.error.userId).toBeUndefined();
			expect(options.extra.error.detail).toBe('x');
			expect(options.extra.error.note).not.toContain('a@b.com');
		});

		it('serializes an Error nested in a non-Error payload handed to Sentry', async () => {
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			logger.error('Failed operation', { err: new Error('bad thing') });
			const [, options] = vi.mocked(sentry.captureMessage).mock.calls[0] as unknown as [
				string,
				{ extra: { error: Record<string, unknown> } }
			];
			expect(options.extra.error.err).toEqual({ name: 'Error', message: 'bad thing' });
		});

		it('does not redact free text in development', async () => {
			delete process.env.NODE_ENV;
			const { logger } = await import('../lib/server/logger');
			logger.error('Failed operation', new Error('Failed for a@b.com'));
			const line = errorSpy.mock.calls.at(-1)?.[0] as string;
			expect(line).toContain('a@b.com');
		});
	});

	describe('Sentry forwarding', () => {
		it('does not forward to Sentry in dev', async () => {
			vi.resetModules();
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			logger.warn('careful');
			logger.error('boom', new Error('bad thing'));
			expect(sentry.captureMessage).not.toHaveBeenCalled();
			expect(sentry.captureException).not.toHaveBeenCalled();
		});

		it('forwards warn() and error() to Sentry in production without throwing', async () => {
			vi.resetModules();
			process.env.NODE_ENV = 'production';
			const sentry = await import('@sentry/sveltekit');
			const { logger } = await import('../lib/server/logger');
			expect(() => logger.warn('careful')).not.toThrow();
			expect(() => logger.error('boom', new Error('bad thing'))).not.toThrow();
			expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
			expect(sentry.captureException).toHaveBeenCalledTimes(1);
		});
	});
});
