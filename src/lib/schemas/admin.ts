import { z } from 'zod';

// Roles the admin UI can assign. Mirrors `adminRoles` / `defaultRole` in
// src/lib/server/auth/index.ts — keep in sync if either changes.
export const USER_ROLES = ['user', 'admin'] as const;

export const setRoleSchema = z.object({
	userId: z.string().min(1, 'User ID is required'),
	role: z.enum(USER_ROLES)
});

export const banUserSchema = z.object({
	userId: z.string().min(1, 'User ID is required'),
	banReason: z.string().max(500, 'Reason too long').trim().optional()
});

export const unbanUserSchema = z.object({
	userId: z.string().min(1, 'User ID is required')
});

export const removeUserSchema = z.object({
	userId: z.string().min(1, 'User ID is required')
});

// Admin "Add user" form. No password field: the server generates a random one the
// admin never sees, and the new user sets their own via the forgot-password flow.
export const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email('Please enter a valid email address')
		.max(254, 'Email too long'),
	role: z.enum(USER_ROLES).default('user')
});
export type CreateUserSchema = typeof createUserSchema;

export const sendWelcomeSchema = z.object({
	userId: z.string().min(1, 'User ID is required')
});
