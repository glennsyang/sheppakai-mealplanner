import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { suggestFromPantrySchema } from '$lib/schemas/pantry';
import { listPantryItems } from '$lib/server/services/pantry';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [pantryItems, form] = await Promise.all([
		listPantryItems(userId),
		superValidate(zod4(suggestFromPantrySchema))
	]);
	return { pantryItems, form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(suggestFromPantrySchema));
		if (!form.valid) return fail(400, { form });
		return { form };
	}
};
