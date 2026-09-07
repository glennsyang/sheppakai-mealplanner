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
