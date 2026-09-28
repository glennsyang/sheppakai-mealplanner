import { addPantryItemSchema, removePantryItemSchema } from '$lib/schemas/pantry';
import { requireAuth } from '$lib/server/actions/auth-guard';
import { logger } from '$lib/server/logger';
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
		const userId = user.id;
		const form = await superValidate(request, zod4(addPantryItemSchema));
		if (!form.valid) return fail(400, { addForm: form });

		try {
			await addPantryItem(userId, form.data.name, form.data.quantity, form.data.unit);
		} catch (err) {
			logger.error('Failed to add pantry item', { userId, err });
			return fail(500, { addForm: form });
		}

		return { addForm: form };
	}),

	remove: requireAuth(async ({ request }, user) => {
		const userId = user.id;
		const form = await superValidate(request, zod4(removePantryItemSchema));
		if (!form.valid) return fail(400, { removeForm: form });

		try {
			await removePantryItem(form.data.id);
		} catch (err) {
			logger.error('Failed to remove pantry item', { userId, err });
			return fail(500, { removeForm: form });
		}

		return {};
	})
};
