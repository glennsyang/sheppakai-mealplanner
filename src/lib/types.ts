import type { mealSuggestionSchema } from '$lib/schemas/mealPlan';
import type { z } from 'zod';

export interface PantryItem {
	id: string;
	userId: string;
	name: string;
	quantity: number | null;
	unit: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Ingredient {
	name: string;
	quantity: string;
	unit: string;
}

// Derived from the runtime schema so the type and the validation can't drift (#171).
export type MealSuggestion = z.output<typeof mealSuggestionSchema>;

export type RecipeSource = 'ai' | 'custom';

export interface Recipe {
	id: string;
	userId: string;
	name: string;
	description: string;
	ingredientsJson: Ingredient[];
	instructionsJson: string[];
	prepTimeMinutes: number;
	servings: number;
	source: RecipeSource;
	createdAt: Date;
	updatedAt: Date;
}

export interface MealPlan {
	id: string;
	userId: string;
	weekStartDate: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MealPlanEntry {
	id: string;
	mealPlanId: string;
	dayOfWeek: number;
	recipeId: string;
	createdAt: Date;
	updatedAt: Date;
}

export const DAY_LABELS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday'
] as const;
