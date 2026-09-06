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

import { sendPasswordResetEmail, sendVerificationEmail } from '../../lib/server/email';

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
		expect(loggerMock.info).toHaveBeenCalledWith('Sending verification email', {
			to: 'user@example.com'
		});
		expect(loggerMock.info).toHaveBeenCalledWith('Verification email sent', {
			to: 'user@example.com',
			brevoMessageId: '<msg-123@brevo>'
		});
	});

	it('throws and logs when the Brevo SDK rejects with an API error', async () => {
		// Brevo throws a BrevoError (extends Error, carries statusCode/body) rather
		// than resolving with an error object.
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

describe('sendPasswordResetEmail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('resolves and logs on a successful send', async () => {
		sendMock.mockResolvedValueOnce({ messageId: '<reset-456@brevo>' });

		await expect(
			sendPasswordResetEmail('user@example.com', 'User', 'https://app/reset?token=abc')
		).resolves.toBeUndefined();

		expect(loggerMock.error).not.toHaveBeenCalled();
		expect(loggerMock.info).toHaveBeenCalledWith('Sending password reset email', {
			to: 'user@example.com'
		});
		expect(loggerMock.info).toHaveBeenCalledWith('Password reset email sent', {
			to: 'user@example.com',
			brevoMessageId: '<reset-456@brevo>'
		});
	});

	it('sends the reset URL in the email body', async () => {
		sendMock.mockResolvedValueOnce({ messageId: '<reset-456@brevo>' });

		await sendPasswordResetEmail('user@example.com', 'User', 'https://app/reset?token=xyz');

		const payload = (sendMock.mock.calls[0] as unknown[])[0] as {
			htmlContent: string;
			subject: string;
		};
		expect(payload.subject).toBe('[Meal Planner] Reset your password');
		expect(payload.htmlContent).toContain('https://app/reset?token=xyz');
	});

	it('throws and logs when the Brevo SDK rejects', async () => {
		sendMock.mockRejectedValueOnce(new Error('network down'));

		await expect(
			sendPasswordResetEmail('user@example.com', 'User', 'https://app/reset?token=abc')
		).rejects.toThrow('network down');

		expect(loggerMock.error).toHaveBeenCalledWith(
			'Failed to send password reset email',
			expect.any(Error),
			{ to: 'user@example.com' }
		);
	});
});
