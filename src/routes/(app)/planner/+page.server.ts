import { getMondayOf, parseIsoDate } from '$lib/dates';
import {
	addMealPlanEntrySchema,
	removeMealPlanEntrySchema,
	saveRecipeSchema,
	addCustomMealSchema,
	ingredientsJsonSchema,
	instructionsJsonSchema,
	weekStartDateSchema
} from '$lib/schemas/mealPlan';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { logger } from '$lib/server/logger';
import {
	getMealPlanWithEntries,
	addMealPlanEntry,
	removeMealPlanEntry,
	getMondayOfCurrentWeek
} from '$lib/server/services/mealPlan';
import { saveRecipe } from '$lib/server/services/recipes';
import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

/**
 * Resolve `?week=` to a Monday plan key. A real date that isn't a Monday redirects to
 * that week's Monday; anything unparseable redirects to the current week, so arbitrary
 * strings never become meal-plan keys and the URL always matches what's shown.
 */
function resolveWeekStartDate(url: URL): string {
	const week = url.searchParams.get('week');
	if (week === null) return getMondayOfCurrentWeek();
	if (weekStartDateSchema.safeParse(week).success) return week;

	const date = parseIsoDate(week);
	if (date) throw redirect(302, `${url.pathname}?week=${getMondayOf(date)}`);
	throw redirect(302, url.pathname);
}

export const load: PageServerLoad = async ({ url }) => {
	const weekStartDate = resolveWeekStartDate(url);

	const [entries, addCustomForm] = await Promise.all([
		getMealPlanWithEntries(weekStartDate),
		superValidate(zod4(addCustomMealSchema))
	]);

	return { entries, weekStartDate, addCustomForm };
};

export const actions: Actions = {
	saveAndAdd: requireAuth(async ({ request }, user) => {
		const userId = user.id;
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
				ingredientsJson: ingredientsJsonSchema.parse(recipeForm.data.ingredientsJson),
				instructionsJson: instructionsJsonSchema.parse(recipeForm.data.instructionsJson),
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
			logger.error('Failed to save recipe and add to planner', err, { userId });
			return fail(500, {});
		}

		return {};
	}),

	remove: requireAuth(async ({ request }, user) => {
		const userId = user.id;
		const form = await superValidate(request, zod4(removeMealPlanEntrySchema));
		if (!form.valid) return fail(400, { form });

		try {
			await removeMealPlanEntry(form.data.entryId);
		} catch (err) {
			logger.error('Failed to remove meal plan entry', err, { userId });
			return fail(500, {});
		}

		return {};
	}),

	addCustom: requireAuth(async ({ request }, user) => {
		const userId = user.id;
		const form = await superValidate(request, zod4(addCustomMealSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const recipe = await saveRecipe(userId, {
				name: form.data.name,
				description: form.data.notes ?? '',
				ingredientsJson: [],
				instructionsJson: [],
				prepTimeMinutes: 0,
				servings: 1,
				source: 'custom'
			});
			await addMealPlanEntry(userId, form.data.weekStartDate, form.data.dayOfWeek, recipe.id);
		} catch (err) {
			if (isRedirect(err)) throw err;
			logger.error('Failed to add custom meal', err, { userId });
			return fail(500, { form });
		}

		return { form };
	})
};
