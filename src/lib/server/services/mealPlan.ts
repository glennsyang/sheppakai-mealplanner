import { randomUUID } from 'node:crypto';

import { logger } from '$lib/logger';
import type { MealPlan, MealPlanEntry, Recipe, Ingredient, RecipeSource } from '$lib/types';
import { eq, and } from 'drizzle-orm';

import { getDb } from '../db';
import { mealPlans, mealPlanEntries, recipes } from '../db/schema';

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

export async function getOrCreateMealPlan(
	userId: string,
	weekStartDate: string
): Promise<MealPlan> {
	logger.debug('getOrCreateMealPlan', { userId, weekStartDate });
	const db = getDb();
	const [existing] = db
		.select()
		.from(mealPlans)
		.where(eq(mealPlans.weekStartDate, weekStartDate))
		.all();

	if (existing) return rowToMealPlan(existing);

	const now = new Date();
	const id = randomUUID();
	await db.insert(mealPlans).values({
		id,
		userId,
		weekStartDate,
		createdAt: now,
		updatedAt: now
	});

	const [created] = db.select().from(mealPlans).where(eq(mealPlans.id, id)).all();
	return rowToMealPlan(created);
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
					ingredientsJson: JSON.parse(recipe.ingredientsJson) as Ingredient[],
					instructionsJson: JSON.parse(recipe.instructionsJson) as string[],
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

	const plan = await getOrCreateMealPlan(userId, weekStartDate);

	// Remove existing entry for this day if present
	const db = getDb();
	await db
		.delete(mealPlanEntries)
		.where(and(eq(mealPlanEntries.mealPlanId, plan.id), eq(mealPlanEntries.dayOfWeek, dayOfWeek)));

	const now = new Date();
	const id = randomUUID();
	await db.insert(mealPlanEntries).values({
		id,
		mealPlanId: plan.id,
		dayOfWeek,
		recipeId,
		createdAt: now,
		updatedAt: now
	});

	const [created] = db.select().from(mealPlanEntries).where(eq(mealPlanEntries.id, id)).all();
	return rowToEntry(created);
}

export async function removeMealPlanEntry(entryId: string): Promise<void> {
	logger.debug('removeMealPlanEntry', { entryId });
	const db = getDb();
	await db.delete(mealPlanEntries).where(eq(mealPlanEntries.id, entryId));
}

export function getMondayOfCurrentWeek(): string {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
	const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const monday = new Date(today);
	monday.setDate(today.getDate() + diff);
	// Use local date components to avoid UTC offset changing the date
	const year = monday.getFullYear();
	const month = String(monday.getMonth() + 1).padStart(2, '0');
	const day = String(monday.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
