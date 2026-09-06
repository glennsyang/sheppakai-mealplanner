import { BREVO_API_KEY, BREVO_FROM_ADDRESS } from '$app/env/private';
import { BrevoClient } from '@getbrevo/brevo';

import { logger } from '../logger';

const brevo = new BrevoClient({ apiKey: BREVO_API_KEY });

export async function sendVerificationEmail(to: string, name: string, verificationUrl: string) {
	// This is intentionally info-level: production suppresses debug logs, and
	// this event distinguishes an untriggered auth flow from a provider failure.
	logger.info('Sending verification email', { to });

	let result;
	try {
		result = await brevo.transactionalEmails.sendTransacEmail({
			sender: { name: 'Meal Planner', email: BREVO_FROM_ADDRESS },
			to: [{ email: to, name }],
			subject: '[Meal Planner] Verify your email address',
			htmlContent: `
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
		logger.error('Failed to send verification email', cause, { to });
		throw cause instanceof Error ? cause : new Error('Brevo request failed', { cause });
	}

	logger.info('Verification email sent', { to, brevoMessageId: result.messageId });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
	// Info-level for the same reason as sendVerificationEmail: it separates an
	// untriggered reset flow from a provider failure in production logs.
	logger.info('Sending password reset email', { to });

	let result;
	try {
		result = await brevo.transactionalEmails.sendTransacEmail({
			sender: { name: 'Meal Planner', email: BREVO_FROM_ADDRESS },
			to: [{ email: to, name }],
			subject: '[Meal Planner] Reset your password',
			htmlContent: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Reset your password</title>
				</head>
				<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 28px;">Reset your password</h1>
					</div>
					<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
						<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
						<p style="font-size: 16px; margin-bottom: 20px;">
							We received a request to reset your Meal Planner password. Click the button below to choose a new one.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${resetUrl}"
							   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
								Reset Password
							</a>
						</div>
						<p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
							If you didn't request a password reset, you can safely ignore this email — your password won't change.
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
		logger.error('Failed to send password reset email', cause, { to });
		throw cause instanceof Error ? cause : new Error('Brevo request failed', { cause });
	}

	logger.info('Password reset email sent', { to, brevoMessageId: result.messageId });
}
