import { getMondayOf, parseIsoDate } from '$lib/dates';
import {
	removeMealPlanEntrySchema,
	saveAndAddSchema,
	addCustomMealSchema,
	ingredientsJsonSchema,
	instructionsJsonSchema,
	updateRecipeSchema,
	weekStartDateSchema
} from '$lib/schemas/mealPlan';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { handleDomainAction } from '$lib/server/actions/domain-action';
import {
	getMealPlanWithEntries,
	addMealPlanEntry,
	removeMealPlanEntry,
	getMondayOfCurrentWeek
} from '$lib/server/services/mealPlan';
import { saveRecipe, updateRecipe } from '$lib/server/services/recipes';
import { fail, redirect } from '@sveltejs/kit';
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
		const form = await superValidate(request, zod4(saveAndAddSchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(
			form,
			async () => {
				const recipe = await saveRecipe(user.id, {
					name: form.data.name,
					description: form.data.description,
					ingredientsJson: ingredientsJsonSchema.parse(form.data.ingredientsJson),
					instructionsJson: instructionsJsonSchema.parse(form.data.instructionsJson),
					prepTimeMinutes: form.data.prepTimeMinutes,
					servings: form.data.servings
				});
				await addMealPlanEntry(user.id, form.data.weekStartDate, form.data.dayOfWeek, recipe.id);
			},
			{
				loggerContext: 'Failed to save recipe and add to planner',
				fallbackMessage: 'Could not add that meal to the planner. Please try again.',
				logFields: { userId: user.id }
			}
		);
	}),

	remove: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(removeMealPlanEntrySchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(form, () => removeMealPlanEntry(form.data.entryId), {
			loggerContext: 'Failed to remove meal plan entry',
			fallbackMessage: 'Could not remove that meal. Please try again.',
			logFields: { userId: user.id }
		});
	}),

	addCustom: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(addCustomMealSchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(
			form,
			async () => {
				const recipe = await saveRecipe(user.id, {
					name: form.data.name,
					description: form.data.notes ?? '',
					ingredientsJson: [],
					instructionsJson: [],
					prepTimeMinutes: 0,
					servings: 1,
					source: 'custom'
				});
				await addMealPlanEntry(user.id, form.data.weekStartDate, form.data.dayOfWeek, recipe.id);
			},
			{
				loggerContext: 'Failed to add custom meal',
				fallbackMessage: 'Could not add your meal. Please try again.',
				logFields: { userId: user.id }
			}
		);
	}),

	updateRecipe: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(updateRecipeSchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(
			form,
			() =>
				updateRecipe(form.data.recipeId, {
					name: form.data.name,
					description: form.data.description,
					ingredientsJson: ingredientsJsonSchema.parse(form.data.ingredientsJson),
					instructionsJson: instructionsJsonSchema.parse(form.data.instructionsJson),
					prepTimeMinutes: form.data.prepTimeMinutes,
					servings: form.data.servings
				}),
			{
				loggerContext: 'Failed to update recipe',
				fallbackMessage: 'Could not save that recipe. Please try again.',
				logFields: { userId: user.id }
			}
		);
	})
};
