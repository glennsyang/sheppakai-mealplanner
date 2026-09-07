// Shared Better Auth error-code -> user-facing message map.
//
// Cross-repo counterparts (keep the map body in sync with these):
//   - synapse:          src/lib/utils/auth.ts
//   - sheppakai-budget: src/lib/utils.ts  (consumed by src/lib/server/actions/auth-form-handler.ts)
// Tracking issue: glennsyang/sheppakai-budget#439.
//
// Only imported from `+page.server.ts` auth actions, hence it lives under
// `src/lib/server/` rather than a `src/lib/utils` tree this repo doesn't have.

/**
 * Extracts the error code from a better-auth error response.
 * Better-auth errors have a structure like: { body: { code: string, message: string } }
 * @param error - The error object caught from a better-auth API call
 * @returns The error code string if it exists, undefined otherwise
 */
function getBetterAuthErrorCode(error: unknown): string | undefined {
	return (error as { body?: { code?: string } })?.body?.code;
}

/**
 * Maps better-auth error codes to user-friendly messages.
 * @param error - The error object caught from a better-auth API call
 * @param defaultMessage - Optional default message to return if error code is not recognized
 * @returns A user-friendly error message
 */
export function getBetterAuthErrorMessage(
	error: unknown,
	defaultMessage = 'An error occurred. Please try again.'
): string {
	const errorCode = getBetterAuthErrorCode(error);

	if (!errorCode) {
		return defaultMessage;
	}

	// Map error codes to user-friendly messages
	const errorMessages: Record<string, string> = {
		// User & Authentication errors
		USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
			'An account with this email already exists. Please sign in instead.',
		USER_ALREADY_EXISTS: 'This account already exists.',
		USER_NOT_FOUND: "We couldn't find an account with those credentials.",
		INVALID_EMAIL: 'Please enter a valid email address.',
		INVALID_PASSWORD: 'The password you entered is incorrect.',
		INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password. Please try again.',
		PASSWORD_TOO_SHORT: 'Your password is too short. Please use at least 8 characters.',
		PASSWORD_TOO_LONG: 'Your password is too long. Please use fewer characters.',
		EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in.',
		EMAIL_ALREADY_VERIFIED: 'Your email is already verified.',
		USER_EMAIL_NOT_FOUND: 'No email address found for this account.',

		// Session errors
		SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
		SESSION_NOT_FRESH: 'Please sign in again to perform this action.',
		FAILED_TO_CREATE_SESSION: 'Unable to create session. Please try again.',
		FAILED_TO_GET_SESSION: 'Unable to retrieve your session. Please sign in again.',

		// Account linking errors
		SOCIAL_ACCOUNT_ALREADY_LINKED: 'This social account is already linked to another user.',
		LINKED_ACCOUNT_ALREADY_EXISTS: 'This account is already linked.',
		FAILED_TO_UNLINK_LAST_ACCOUNT: 'You cannot unlink your last sign-in method.',
		ACCOUNT_NOT_FOUND: 'Account not found.',
		CREDENTIAL_ACCOUNT_NOT_FOUND: 'No password set for this account.',

		// Token & verification errors
		INVALID_TOKEN: 'This link is invalid or has expired.',
		TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
		FAILED_TO_CREATE_VERIFICATION: 'Unable to send verification email. Please try again.',

		// Security errors
		CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
			'This request appears to be a security risk and has been blocked.',
		INVALID_ORIGIN: 'Invalid request origin.',
		MISSING_OR_NULL_ORIGIN: 'Missing request origin.',

		// Validation errors
		VALIDATION_ERROR: 'Please check your input and try again.',
		FIELD_NOT_ALLOWED: 'You cannot set this field.',
		MISSING_FIELD: 'Please fill in all required fields.',
		INVALID_CALLBACK_URL: 'Invalid callback URL.',
		INVALID_REDIRECT_URL: 'Invalid redirect URL.',
		CALLBACK_URL_REQUIRED: 'Callback URL is required.',

		// Provider errors
		PROVIDER_NOT_FOUND: 'Authentication provider not found.',
		FAILED_TO_GET_USER_INFO: 'Unable to retrieve user information from provider.',

		// Generic errors
		FAILED_TO_CREATE_USER: 'Unable to create account. Please try again.',
		FAILED_TO_UPDATE_USER: 'Unable to update account. Please try again.',
		INVALID_USER: 'Invalid user data.'
	};

	return errorMessages[errorCode] || defaultMessage;
}
