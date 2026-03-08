import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { recipes } from '../db/schema';
import type { Recipe, Ingredient } from '$lib/types';
import { logger } from '$lib/logger';
import { randomUUID } from 'crypto';

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
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function listRecipes(userId: string): Promise<Recipe[]> {
	logger.debug('listRecipes', { userId });
	const rows = await db.select().from(recipes).where(eq(recipes.userId, userId)).all();
	return rows.map(rowToRecipe);
}

export async function getRecipe(userId: string, recipeId: string): Promise<Recipe | null> {
	logger.debug('getRecipe', { userId, recipeId });
	const [row] = await db
		.select()
		.from(recipes)
		.where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
		.all();
	return row ? rowToRecipe(row) : null;
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
	}
): Promise<Recipe> {
	logger.debug('saveRecipe', { userId, name: data.name });
	const now = new Date();
	const id = randomUUID();
	await db.insert(recipes).values({
		id,
		userId,
		name: data.name,
		description: data.description,
		ingredientsJson: JSON.stringify(data.ingredientsJson),
		instructionsJson: JSON.stringify(data.instructionsJson),
		prepTimeMinutes: data.prepTimeMinutes,
		servings: data.servings,
		createdAt: now,
		updatedAt: now
	});
	const [row] = await db.select().from(recipes).where(eq(recipes.id, id)).all();
	return rowToRecipe(row);
}

export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
	logger.debug('deleteRecipe', { userId, recipeId });
	await db
		.delete(recipes)
		.where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
}
