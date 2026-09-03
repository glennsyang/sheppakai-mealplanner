import { RESEND_API_KEY, RESEND_FROM_ADDRESS } from '$app/env/private';
import { Resend } from 'resend';

import { logger } from '../logger';

// Initialize Resend email client
const resend = new Resend(RESEND_API_KEY);

/**
 * Sends the account verification email via Resend.
 *
 * Throws on any failure so callers (and better-auth) can react. The Resend SDK
 * does NOT throw on API-level rejections — invalid API key, unverified sending
 * domain, malformed `from` — it resolves with `{ data: null, error: {...} }`.
 * That `error` must be inspected explicitly; otherwise the failure is swallowed
 * and nothing is logged even though no mail was ever delivered.
 */
export async function sendVerificationEmail(to: string, name: string, verificationUrl: string) {
	logger.debug('Sending verification email', { to });

	let result;
	try {
		result = await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to,
			subject: '[Meal Planner] Verify your email address',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Verify your email</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Meal Planner</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							Thanks for signing up! Please verify your email address to get started with Meal Planner.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${verificationUrl}"
							   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
								Verify Email Address
							</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
							If you didn't create an account, you can safely ignore this email.
						</p>
						<p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
							This link will expire in 10 minutes.
						</p>
					</div>
					<div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
						<p>Meal Planner</p>
					</div>
				</body>
				</html>
			`
		});
	} catch (cause) {
		// Network / unexpected transport failure (the SDK rejected the promise).
		logger.error('Failed to send verification email (transport error)', cause, { to });
		throw cause instanceof Error ? cause : new Error('Resend request failed', { cause });
	}

	if (result.error) {
		logger.error('Failed to send verification email (Resend API error)', result.error, { to });
		throw new Error(
			`Resend rejected verification email: ${result.error.name} — ${result.error.message}`
		);
	}

	logger.info('Verification email sent', { to, resendId: result.data?.id });
}
