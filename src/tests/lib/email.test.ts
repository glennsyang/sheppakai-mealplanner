import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sendMock, loggerMock } = vi.hoisted(() => ({
	sendMock: vi.fn<() => Promise<unknown>>(),
	loggerMock: {
		debug: vi.fn<() => void>(),
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

vi.mock('$app/env/private', () => ({
	RESEND_API_KEY: 're_test_key',
	RESEND_FROM_ADDRESS: 'test@example.com'
}));

vi.mock('resend', () => ({
	Resend: class {
		emails = { send: sendMock };
	}
}));

vi.mock('../../lib/server/logger', () => ({ logger: loggerMock }));

import { sendVerificationEmail } from '../../lib/server/email';

describe('sendVerificationEmail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resolves and logs on a successful send', async () => {
		sendMock.mockResolvedValueOnce({ data: { id: 'email_123' }, error: null });

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).resolves.toBeUndefined();

		expect(loggerMock.error).not.toHaveBeenCalled();
		expect(loggerMock.info).toHaveBeenCalledWith('Verification email sent', {
			to: 'user@example.com',
			resendId: 'email_123'
		});
	});

	it('throws and logs when Resend returns an API error object (no throw)', async () => {
		sendMock.mockResolvedValueOnce({
			data: null,
			error: { name: 'validation_error', message: 'The domain is not verified', statusCode: 403 }
		});

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).rejects.toThrow(/Resend rejected verification email/);

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send verification email (Resend API error)',
			expect.objectContaining({ name: 'validation_error' }),
			{ to: 'user@example.com' }
		);
	});

	it('throws and logs when the Resend SDK rejects (transport error)', async () => {
		sendMock.mockRejectedValueOnce(new Error('network down'));

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).rejects.toThrow('network down');

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send verification email (transport error)',
			expect.any(Error),
			{ to: 'user@example.com' }
		);
	});
});
