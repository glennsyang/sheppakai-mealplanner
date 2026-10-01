import { randomUUID } from 'node:crypto';

import { storedIngredientListSchema, storedInstructionListSchema } from '$lib/schemas/mealPlan';
import { logger } from '$lib/server/logger';
import type { Recipe, Ingredient, RecipeSource } from '$lib/types';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { getDb } from '../db';
import { recipes } from '../db/schema';

// Rows saved before input validation may hold any JSON, so a malformed one degrades to an empty
// list instead of throwing and breaking every page that lists recipes.
function parseStoredRecipeJson(row: typeof recipes.$inferSelect): {
	ingredientsJson: Ingredient[];
	instructionsJson: string[];
} {
	return {
		ingredientsJson: parseStoredList(row.id, row.ingredientsJson, storedIngredientListSchema),
		instructionsJson: parseStoredList(row.id, row.instructionsJson, storedInstructionListSchema)
	};
}

function parseStoredList<S extends z.ZodType<unknown[]>>(
	recipeId: string,
	raw: string,
	schema: S
): z.output<S> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = undefined;
	}
	const result = schema.safeParse(parsed);
	if (!result.success) {
		logger.warn('Malformed stored recipe JSON', { recipeId });
		return [] as z.output<S>;
	}
	return result.data;
}

/** The single DB-row → Recipe mapping; reuse it rather than re-spelling the fields. */
export function rowToRecipe(row: typeof recipes.$inferSelect): Recipe {
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		description: row.description,
		...parseStoredRecipeJson(row),
		prepTimeMinutes: row.prepTimeMinutes,
		servings: row.servings,
		source: row.source as RecipeSource,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function saveRecipe(
	userId: string,
	data: {
		name: string;
		description: string;
		ingredientsJson: Ingredient[];
		instructionsJson: string[];
		prepTimeMinutes: number;
		servings: number;
		source?: RecipeSource;
	}
): Promise<Recipe> {
	logger.debug('saveRecipe', { userId, name: data.name });
	const now = new Date();
	const id = randomUUID();
	const db = getDb();
	await db.insert(recipes).values({
		id,
		userId,
		name: data.name,
		description: data.description,
		ingredientsJson: JSON.stringify(data.ingredientsJson),
		instructionsJson: JSON.stringify(data.instructionsJson),
		prepTimeMinutes: data.prepTimeMinutes,
		servings: data.servings,
		source: data.source ?? 'ai',
		createdAt: now,
		updatedAt: now
	});
	const [row] = db.select().from(recipes).where(eq(recipes.id, id)).all();
	return rowToRecipe(row);
}

/** Overwrite a saved recipe's content. Keeps its source, so a written-in meal stays custom. */
export async function updateRecipe(
	id: string,
	data: {
		name: string;
		description: string;
		ingredientsJson: Ingredient[];
		instructionsJson: string[];
		prepTimeMinutes: number;
		servings: number;
	}
): Promise<Recipe> {
	logger.debug('updateRecipe', { id });
	const db = getDb();
	const [row] = db
		.update(recipes)
		.set({
			name: data.name,
			description: data.description,
			ingredientsJson: JSON.stringify(data.ingredientsJson),
			instructionsJson: JSON.stringify(data.instructionsJson),
			prepTimeMinutes: data.prepTimeMinutes,
			servings: data.servings,
			updatedAt: new Date()
		})
		.where(eq(recipes.id, id))
		.returning()
		.all();
	if (!row) throw new Error(`Recipe not found: ${id}`);
	return rowToRecipe(row);
}
