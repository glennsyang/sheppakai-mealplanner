import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─── better-auth tables ─────────────────────────────────────────────────────

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	// Columns for the better-auth `admin` plugin (wired up in src/lib/server/auth/index.ts).
	// `role` / `banned` carry NOT NULL defaults so existing rows backfill
	// cleanly; `ban_reason` / `ban_expires` are written by `auth.api.banUser` and left NULL
	// otherwise. The plugin registers the same fields on its own model — keep the names and
	// types here in sync with node_modules/better-auth/dist/plugins/admin/schema.mjs.
	role: text('role').notNull().default('user'),
	banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
	banReason: text('ban_reason'),
	banExpires: integer('ban_expires', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	// Set by better-auth's admin plugin while an admin is impersonating this session.
	impersonatedBy: text('impersonated_by'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		// Scopes account identity by issuer (e.g. "local:credential"), required by
		// better-auth 1.7+. All accounts here are credential accounts, so the
		// default backfills existing rows correctly with no data migration needed.
		issuer: text('issuer').notNull().default('local:credential'),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('account_issuer_account_id_idx').on(table.issuer, table.accountId)]
);

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Only used when rateLimit.storage is 'database' (production — see auth/index.ts).
// Shape mirrors better-auth's built-in rateLimit model exactly: id + key/count/
// lastRequest and nothing else. Better-auth populates only these fields on insert,
// so this table must not add extra NOT NULL columns (no created_at/updated_at).
export const rateLimit = sqliteTable('rate_limit', {
	id: text('id').primaryKey(),
	key: text('key').notNull().unique(),
	count: integer('count').notNull(),
	lastRequest: integer('last_request').notNull() // ms epoch; better-auth treats it as a plain number
});

// ─── App tables ──────────────────────────────────────────────────────────────
//
// These rows are shared household data (see CLAUDE.md, "Product Data-Sharing Model").
// `user_id` only records who created the row, so it's nullable with ON DELETE SET NULL:
// removing a member must never cascade-delete pantry items, recipes or plans the other
// member still relies on.

export const pantryItems = sqliteTable('pantry_items', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	quantity: real('quantity'),
	unit: text('unit'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const recipes = sqliteTable('recipes', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	description: text('description').notNull(),
	ingredientsJson: text('ingredients_json').notNull(),
	instructionsJson: text('instructions_json').notNull(),
	prepTimeMinutes: integer('prep_time_minutes').notNull(),
	servings: integer('servings').notNull(),
	source: text('source').notNull().default('ai'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// One shared plan per week, one entry per day — enforced by unique indexes so
// concurrent writes can't create duplicates (see services/mealPlan.ts).
export const mealPlans = sqliteTable(
	'meal_plans',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		weekStartDate: text('week_start_date').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('meal_plans_week_start_date_idx').on(table.weekStartDate)]
);

export const mealPlanEntries = sqliteTable(
	'meal_plan_entries',
	{
		id: text('id').primaryKey(),
		mealPlanId: text('meal_plan_id')
			.notNull()
			.references(() => mealPlans.id, { onDelete: 'cascade' }),
		dayOfWeek: integer('day_of_week').notNull(),
		recipeId: text('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('meal_plan_entries_plan_day_idx').on(table.mealPlanId, table.dayOfWeek)]
);
