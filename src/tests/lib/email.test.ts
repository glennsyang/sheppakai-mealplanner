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
	BREVO_API_KEY: 'xkeysib_test_key',
	BREVO_FROM_ADDRESS: 'test@example.com'
}));

vi.mock('@getbrevo/brevo', () => ({
	BrevoClient: class {
		transactionalEmails = { sendTransacEmail: sendMock };
	}
}));

vi.mock('../../lib/server/logger', () => ({ logger: loggerMock }));

import { sendVerificationEmail } from '../../lib/server/email';

describe('sendVerificationEmail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resolves and logs on a successful send', async () => {
		sendMock.mockResolvedValueOnce({ messageId: '<msg-123@brevo>' });

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).resolves.toBeUndefined();

		expect(loggerMock.error).not.toHaveBeenCalled();
		expect(loggerMock.info).toHaveBeenCalledWith('Verification email sent', {
			to: 'user@example.com',
			brevoMessageId: '<msg-123@brevo>'
		});
	});

	it('throws and logs when the Brevo SDK rejects with an API error', async () => {
		// Brevo throws a BrevoError (extends Error, carries statusCode/body) rather
		// than resolving with an error object the way Resend did.
		const apiError = Object.assign(new Error('Sender not valid'), { statusCode: 403 });
		sendMock.mockRejectedValueOnce(apiError);

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).rejects.toThrow(/Sender not valid/);

		expect(loggerMock.error).toHaveBeenCalledWith('Failed to send verification email', apiError, {
			to: 'user@example.com'
		});
	});

	it('throws and logs when the Brevo SDK rejects (transport error)', async () => {
		sendMock.mockRejectedValueOnce(new Error('network down'));

		await expect(
			sendVerificationEmail('user@example.com', 'User', 'https://app/verify?token=abc')
		).rejects.toThrow('network down');

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send verification email',
			expect.any(Error),
			{ to: 'user@example.com' }
		);
	});
});
