-- Hand-edited from drizzle-kit output (#164).
--
-- drizzle-orm's migrator wraps every migration in BEGIN/COMMIT, where
-- `PRAGMA foreign_keys=OFF` is a silent no-op. better-sqlite3 enforces FKs by
-- default, so DROP TABLE on `meal_plans` / `recipes` would cascade-delete every
-- `meal_plan_entries` row. Back the entries up first and restore them at the end.
CREATE TABLE `__backup_meal_plan_entries` AS SELECT * FROM `meal_plan_entries`;--> statement-breakpoint
CREATE TABLE `__new_meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`week_start_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_meal_plans`("id", "user_id", "week_start_date", "created_at", "updated_at") SELECT "id", "user_id", "week_start_date", "created_at", "updated_at" FROM `meal_plans`;--> statement-breakpoint
DROP TABLE `meal_plans`;--> statement-breakpoint
ALTER TABLE `__new_meal_plans` RENAME TO `meal_plans`;--> statement-breakpoint
CREATE TABLE `__new_pantry_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`quantity` real,
	`unit` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_pantry_items`("id", "user_id", "name", "quantity", "unit", "created_at", "updated_at") SELECT "id", "user_id", "name", "quantity", "unit", "created_at", "updated_at" FROM `pantry_items`;--> statement-breakpoint
DROP TABLE `pantry_items`;--> statement-breakpoint
ALTER TABLE `__new_pantry_items` RENAME TO `pantry_items`;--> statement-breakpoint
CREATE TABLE `__new_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`ingredients_json` text NOT NULL,
	`instructions_json` text NOT NULL,
	`prep_time_minutes` integer NOT NULL,
	`servings` integer NOT NULL,
	`source` text DEFAULT 'ai' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_recipes`("id", "user_id", "name", "description", "ingredients_json", "instructions_json", "prep_time_minutes", "servings", "source", "created_at", "updated_at") SELECT "id", "user_id", "name", "description", "ingredients_json", "instructions_json", "prep_time_minutes", "servings", "source", "created_at", "updated_at" FROM `recipes`;--> statement-breakpoint
DROP TABLE `recipes`;--> statement-breakpoint
ALTER TABLE `__new_recipes` RENAME TO `recipes`;--> statement-breakpoint
CREATE TABLE `__new_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`pantry_snapshot_json` text NOT NULL,
	`results_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_suggestions`("id", "user_id", "pantry_snapshot_json", "results_json", "created_at", "updated_at") SELECT "id", "user_id", "pantry_snapshot_json", "results_json", "created_at", "updated_at" FROM `suggestions`;--> statement-breakpoint
DROP TABLE `suggestions`;--> statement-breakpoint
ALTER TABLE `__new_suggestions` RENAME TO `suggestions`;--> statement-breakpoint
-- Collapse duplicate plans per week onto the oldest one, re-pointing their entries.
UPDATE `__backup_meal_plan_entries` SET `meal_plan_id` = k.`keeper_id`
FROM (
	SELECT `id`, FIRST_VALUE(`id`) OVER (PARTITION BY `week_start_date` ORDER BY `created_at`, `id`) AS `keeper_id`
	FROM `meal_plans`
) AS k
WHERE `__backup_meal_plan_entries`.`meal_plan_id` = k.`id` AND k.`id` <> k.`keeper_id`;--> statement-breakpoint
DELETE FROM `meal_plans` WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `week_start_date` ORDER BY `created_at`, `id`) AS `rn`
		FROM `meal_plans`
	) WHERE `rn` > 1
);--> statement-breakpoint
-- Keep only the most recent entry per (plan, day) — matches the old replace-on-add semantics.
DELETE FROM `__backup_meal_plan_entries` WHERE `id` IN (
	SELECT `id` FROM (
		SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `meal_plan_id`, `day_of_week` ORDER BY `updated_at` DESC, `id` DESC) AS `rn`
		FROM `__backup_meal_plan_entries`
	) WHERE `rn` > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX `meal_plans_week_start_date_idx` ON `meal_plans` (`week_start_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `meal_plan_entries_plan_day_idx` ON `meal_plan_entries` (`meal_plan_id`,`day_of_week`);--> statement-breakpoint
DELETE FROM `meal_plan_entries`;--> statement-breakpoint
INSERT INTO `meal_plan_entries`("id", "meal_plan_id", "day_of_week", "recipe_id", "created_at", "updated_at")
SELECT b."id", b."meal_plan_id", b."day_of_week", b."recipe_id", b."created_at", b."updated_at"
FROM `__backup_meal_plan_entries` b
WHERE b."meal_plan_id" IN (SELECT `id` FROM `meal_plans`) AND b."recipe_id" IN (SELECT `id` FROM `recipes`);--> statement-breakpoint
DROP TABLE `__backup_meal_plan_entries`;
