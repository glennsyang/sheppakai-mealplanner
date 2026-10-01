import { weekdayIndex } from '$lib/dates';
import { getMealPlanWithEntries, getMondayOfCurrentWeek } from '$lib/server/services/mealPlan';
import { listPantryItems } from '$lib/server/services/pantry';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const weekStartDate = getMondayOfCurrentWeek();
	const [entries, pantryItems] = await Promise.all([
		getMealPlanWithEntries(weekStartDate),
		listPantryItems()
	]);

	// Server-local guess at today; the page corrects it to the browser's own clock.
	return {
		weekStartDate,
		entries,
		pantryCount: pantryItems.length,
		todayIndex: weekdayIndex(new Date())
	};
};
