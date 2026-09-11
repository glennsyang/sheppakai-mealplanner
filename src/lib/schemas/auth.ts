import { z } from 'zod';

// Canonical password rule for register/reset (sheppakai-budget#444), shared across the
// sibling apps: min 12 chars + upper/lower/number/special-character complexity. 12 also
// matches emailAndPassword.minPasswordLength in src/lib/server/auth/index.ts; better-auth
// rejects anything shorter server-side regardless.
const passwordSchema = z
	.string()
	.min(12, 'Password must be at least 12 characters')
	.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	.regex(/\d/, 'Password must contain at least one number')
	.regex(
		/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
		'Password must contain at least one special character'
	);

export const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required')
});

export const resendVerificationSchema = z.object({
	email: z.string().email('Please enter a valid email address')
});

export const registerSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.string().email('Please enter a valid email address'),
		password: passwordSchema,
		confirmPassword: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

// Added for cross-app parity with sheppakai-budget (tracking: sheppakai-budget#432).
// No route consumes it yet — mealplanner has no in-app "change password" flow — but
// the shape is kept identical to the other apps for when one is added.
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(12, 'New password must be at least 12 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const forgotPasswordSchema = z.object({
	email: z.string().email('Please enter a valid email address')
});

export const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: z.string().min(1, 'Please confirm your password'),
		// Carried through the form as a hidden field so the action can consume the
		// token from the reset link; the page also guards on its presence.
		token: z.string().optional()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});
