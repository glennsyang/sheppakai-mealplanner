import { randomUUID } from 'node:crypto';

import { logger } from '$lib/logger';
import type { Recipe, Ingredient, RecipeSource } from '$lib/types';
import { eq } from 'drizzle-orm';

import { getDb } from '../db';
import { recipes } from '../db/schema';

function rowToRecipe(row: typeof recipes.$inferSelect): Recipe {
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		description: row.description,
		ingredientsJson: JSON.parse(row.ingredientsJson) as Ingredient[],
		instructionsJson: JSON.parse(row.instructionsJson) as string[],
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
