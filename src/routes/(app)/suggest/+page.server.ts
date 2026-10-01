import { listPantryItems } from '$lib/server/services/pantry';

import type { PageServerLoad } from './$types';

// No form actions: the page calls POST /api/suggest directly.
export const load: PageServerLoad = async () => {
	const pantryItems = await listPantryItems();
	return { pantryItems };
};
