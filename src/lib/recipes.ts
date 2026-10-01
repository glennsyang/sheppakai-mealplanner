import type { MealSuggestion, Recipe } from '$lib/types';

/** A saved recipe in the shape the recipe drawer reads. */
export function recipeAsSuggestion(recipe: Recipe): MealSuggestion {
	return {
		name: recipe.name,
		description: recipe.description,
		ingredients: recipe.ingredientsJson,
		steps: recipe.instructionsJson,
		prepTimeMinutes: recipe.prepTimeMinutes,
		servings: recipe.servings
	};
}
