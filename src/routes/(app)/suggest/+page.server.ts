import { suggestFromPantrySchema } from '$lib/schemas/pantry';
import { listPantryItems } from '$lib/server/services/pantry';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const [pantryItems, form] = await Promise.all([
    listPantryItems(),
    superValidate(zod4(suggestFromPantrySchema)),
  ]);
  return { pantryItems, form };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod4(suggestFromPantrySchema));
    if (!form.valid) return fail(400, { form });
    return { form };
  },
};
