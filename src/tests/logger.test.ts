import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
	let writeSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		writeSpy.mockRestore();
		delete process.env.NODE_ENV;
		delete process.env.LOG_LEVEL;
	});

	it('outputs info messages to stdout', async () => {
		// Dynamic import so env is read fresh
		vi.resetModules();
		const { logger } = await import('../lib/logger');
		logger.info('test message');
		expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
	});

	it('includes the log level in output', async () => {
		vi.resetModules();
		const { logger } = await import('../lib/logger');
		logger.warn('watch out');
		expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
	});

	it('serializes data objects', async () => {
		vi.resetModules();
		const { logger } = await import('../lib/logger');
		logger.info('with data', { key: 'value' });
		expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('key'));
	});

	it('outputs structured JSON in production', async () => {
		vi.resetModules();
		process.env.NODE_ENV = 'production';
		const { logger } = await import('../lib/logger');
		logger.info('prod message', { detail: 42 });
		const output = String(writeSpy.mock.calls[0][0]);
		const parsed = JSON.parse(output.trim()) as Record<string, unknown>;
		expect(parsed.level).toBe('info');
		expect(parsed.message).toBe('prod message');
		expect((parsed.data as Record<string, unknown>).detail).toBe(42);
	});
});
