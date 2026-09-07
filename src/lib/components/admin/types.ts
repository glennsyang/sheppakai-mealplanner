// Shape of a row in the admin users table, as returned by `auth.api.listUsers`
// (better-auth's `UserWithRole`). Declared explicitly so the table components
// don't depend on better-auth's internal generic plumbing.
export interface AdminUser {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	role?: string | null;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}
