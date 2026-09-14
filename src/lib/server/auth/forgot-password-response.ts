// Canonical cross-repo module surface (auth-audit.md §2F). Kept byte-identical
// across synapse / sheppakai-budget / sheppakai-mealplanner — the whole point is
// that success and failure return the exact same banner, so no path can be used
// to probe whether an email has an account.
export const FORGOT_PASSWORD_RESPONSE = {
	type: 'success',
	text: 'If an account exists with that email, you will receive a password reset link.'
} as const;
