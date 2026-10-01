import { getMondayOf, weekdayIndex } from '$lib/dates';

/**
 * Today's Mon=0 … Sun=6 index within the week starting `weekStartDate`, or null when
 * that week isn't the current one. Uses the browser's clock once mounted (the server
 * may sit in another time zone); until then falls back to `serverGuess`.
 * Call during component initialisation.
 */
export function trackToday(
	weekStartDate: () => string,
	serverGuess: () => number | null = () => null
) {
	let now = $state<Date | null>(null);
	$effect(() => {
		now = new Date();
	});

	return {
		get index(): number | null {
			if (!now) return serverGuess();
			return getMondayOf(now) === weekStartDate() ? weekdayIndex(now) : null;
		}
	};
}
