import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { addMealPlanEntrySchema, removeMealPlanEntrySchema, saveRecipeSchema } from '$lib/schemas/mealPlan';
import {
	getMealPlanWithEntries,
	addMealPlanEntry,
	removeMealPlanEntry,
	getMondayOfCurrentWeek
} from '$lib/server/services/mealPlan';
import { saveRecipe } from '$lib/server/services/recipes';
import { logger } from '$lib/logger';
import type { Actions, PageServerLoad } from './$types';
import type { Ingredient } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const weekStartDate = url.searchParams.get('week') ?? getMondayOfCurrentWeek();

	const [entries, addEntryForm] = await Promise.all([
		getMealPlanWithEntries(userId, weekStartDate),
		superValidate(zod4(addMealPlanEntrySchema))
	]);

	return { entries, weekStartDate, addEntryForm };
};

export const actions: Actions = {
	saveAndAdd: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();

		// Validate the recipe data
		const recipeForm = await superValidate(formData, zod4(saveRecipeSchema));
		if (!recipeForm.valid) return fail(400, { recipeForm });

		// Validate the entry data
		const entryForm = await superValidate(formData, zod4(addMealPlanEntrySchema));
		if (!entryForm.valid) return fail(400, { entryForm });

		try {
			const recipe = await saveRecipe(userId, {
				name: recipeForm.data.name,
				description: recipeForm.data.description,
				ingredientsJson: JSON.parse(recipeForm.data.ingredientsJson) as Ingredient[],
				instructionsJson: JSON.parse(recipeForm.data.instructionsJson) as string[],
				prepTimeMinutes: recipeForm.data.prepTimeMinutes,
				servings: recipeForm.data.servings
			});

			await addMealPlanEntry(
				userId,
				entryForm.data.weekStartDate,
				entryForm.data.dayOfWeek,
				recipe.id
			);
		} catch (err) {
			logger.error('Failed to save recipe and add to planner', { userId, err });
			return fail(500, {});
		}

		return {};
	},

	remove: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const form = await superValidate(request, zod4(removeMealPlanEntrySchema));
		if (!form.valid) return fail(400, { form });

		try {
			await removeMealPlanEntry(userId, form.data.entryId);
		} catch (err) {
			logger.error('Failed to remove meal plan entry', { userId, err });
			return fail(500, {});
		}

		return {};
	}
};
