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

export interface MealSuggestion {
	name: string;
	description: string;
	ingredients: Ingredient[];
	steps: string[];
	prepTimeMinutes: number;
	servings: number;
}

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

export interface Suggestion {
	id: string;
	userId: string;
	pantrySnapshotJson: string[];
	resultsJson: MealSuggestion[];
	createdAt: Date;
	updatedAt: Date;
}

export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayLabel = typeof DAY_LABELS[number];
