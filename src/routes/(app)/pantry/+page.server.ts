import { addPantryItemSchema, removePantryItemSchema } from '$lib/schemas/pantry';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { handleDomainAction } from '$lib/server/actions/domain-action';
import { listPantryItems, addPantryItem, removePantryItem } from '$lib/server/services/pantry';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [items, addForm] = await Promise.all([
		listPantryItems(),
		superValidate(zod4(addPantryItemSchema))
	]);
	return { items, addForm };
};

export const actions: Actions = {
	add: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(addPantryItemSchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(
			form,
			() => addPantryItem(user.id, form.data.name, form.data.quantity, form.data.unit),
			{
				loggerContext: 'Failed to add pantry item',
				fallbackMessage: 'Could not add that item. Please try again.',
				logFields: { userId: user.id }
			}
		);
	}),

	remove: requireAuth(async ({ request }, user) => {
		const form = await superValidate(request, zod4(removePantryItemSchema));
		if (!form.valid) return fail(400, { form });

		return handleDomainAction(form, () => removePantryItem(form.data.id), {
			loggerContext: 'Failed to remove pantry item',
			fallbackMessage: 'Could not remove that item. Please try again.',
			logFields: { userId: user.id }
		});
	})
};
