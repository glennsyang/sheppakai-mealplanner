// Calendar-date helpers shared by server and client. Every function works in local
// date components — never `toISOString()`, which converts to UTC and can shift a
// local-midnight date onto the previous day (see CLAUDE.md, Known Quirks #3).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Format a Date as `YYYY-MM-DD` using its local date components. */
export function toLocalIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/** Parse `YYYY-MM-DD` as local midnight, or `null` if it isn't a real calendar date. */
export function parseIsoDate(value: string): Date | null {
	const match = ISO_DATE.exec(value);
	if (!match) return null;
	const [year, month, day] = match.slice(1).map(Number);
	const date = new Date(year, month - 1, day);
	// Rejects rollovers like 2026-02-30 → March 2.
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null;
	}
	return date;
}

/** The Monday (as `YYYY-MM-DD`) of the week containing `date`. */
export function getMondayOf(date: Date): string {
	const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
	return toLocalIsoDate(monday);
}

/** Shift a `YYYY-MM-DD` date by whole weeks. Throws on an invalid date. */
export function addWeeks(isoDate: string, weeks: number): string {
	const date = parseIsoDate(isoDate);
	if (!date) throw new Error(`Invalid ISO date: ${isoDate}`);
	date.setDate(date.getDate() + weeks * 7);
	return toLocalIsoDate(date);
}
