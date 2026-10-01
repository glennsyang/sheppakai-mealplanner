import { randomUUID } from 'node:crypto';

import { getMondayOf } from '$lib/dates';
import { logger } from '$lib/server/logger';
import type { MealPlan, MealPlanEntry, Recipe, RecipeSource } from '$lib/types';
import { eq } from 'drizzle-orm';

import { getDb } from '../db';
import { mealPlans, mealPlanEntries, recipes } from '../db/schema';
import { parseStoredRecipeJson } from './recipes';

function rowToMealPlan(row: typeof mealPlans.$inferSelect): MealPlan {
	return {
		id: row.id,
		userId: row.userId,
		weekStartDate: row.weekStartDate,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

function rowToEntry(row: typeof mealPlanEntries.$inferSelect): MealPlanEntry {
	return {
		id: row.id,
		mealPlanId: row.mealPlanId,
		dayOfWeek: row.dayOfWeek,
		recipeId: row.recipeId,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Upsert on the unique `week_start_date` index so concurrent callers converge on one
 * shared plan per week. Must run inside the caller's transaction.
 */
function getOrCreateMealPlan(tx: Tx, userId: string, weekStartDate: string): MealPlan {
	const now = new Date();
	tx.insert(mealPlans)
		.values({ id: randomUUID(), userId, weekStartDate, createdAt: now, updatedAt: now })
		.onConflictDoNothing({ target: mealPlans.weekStartDate })
		.run();

	const plan = tx.select().from(mealPlans).where(eq(mealPlans.weekStartDate, weekStartDate)).get();
	if (!plan) throw new Error(`Meal plan for ${weekStartDate} missing after upsert`);
	return rowToMealPlan(plan);
}

export interface MealPlanEntryWithRecipe {
	entry: MealPlanEntry;
	recipe: Recipe;
}

export async function getMealPlanWithEntries(
	weekStartDate: string
): Promise<MealPlanEntryWithRecipe[]> {
	logger.debug('getMealPlanWithEntries', { weekStartDate });

	const db = getDb();
	const [plan] = db
		.select()
		.from(mealPlans)
		.where(eq(mealPlans.weekStartDate, weekStartDate))
		.all();

	if (!plan) return [];

	const entries = db
		.select()
		.from(mealPlanEntries)
		.where(eq(mealPlanEntries.mealPlanId, plan.id))
		.all();

	const result: MealPlanEntryWithRecipe[] = [];

	for (const entry of entries) {
		const [recipe] = db.select().from(recipes).where(eq(recipes.id, entry.recipeId)).all();

		if (recipe) {
			result.push({
				entry: rowToEntry(entry),
				recipe: {
					id: recipe.id,
					userId: recipe.userId,
					name: recipe.name,
					description: recipe.description,
					...parseStoredRecipeJson(recipe),
					prepTimeMinutes: recipe.prepTimeMinutes,
					servings: recipe.servings,
					source: recipe.source as RecipeSource,
					createdAt: recipe.createdAt,
					updatedAt: recipe.updatedAt
				}
			});
		}
	}

	return result;
}

export async function addMealPlanEntry(
	userId: string,
	weekStartDate: string,
	dayOfWeek: number,
	recipeId: string
): Promise<MealPlanEntry> {
	logger.debug('addMealPlanEntry', { userId, weekStartDate, dayOfWeek, recipeId });

	// One synchronous transaction: plan get-or-create and the per-day replace can't
	// interleave with another request, and the unique (meal_plan_id, day_of_week)
	// index makes the upsert replace the day's recipe instead of adding a second row.
	const db = getDb();
	return db.transaction((tx) => {
		const plan = getOrCreateMealPlan(tx, userId, weekStartDate);
		const now = new Date();
		const entry = tx
			.insert(mealPlanEntries)
			.values({
				id: randomUUID(),
				mealPlanId: plan.id,
				dayOfWeek,
				recipeId,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [mealPlanEntries.mealPlanId, mealPlanEntries.dayOfWeek],
				set: { recipeId, updatedAt: now }
			})
			.returning()
			.get();
		return rowToEntry(entry);
	});
}

export async function removeMealPlanEntry(entryId: string): Promise<void> {
	logger.debug('removeMealPlanEntry', { entryId });
	const db = getDb();
	await db.delete(mealPlanEntries).where(eq(mealPlanEntries.id, entryId));
}

export function getMondayOfCurrentWeek(): string {
	return getMondayOf(new Date());
}
