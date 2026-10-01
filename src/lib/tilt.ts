/** A small, stable rotation for a word magnet, so a packed fridge never looks machine-set. */
export function magnetTilt(word: string): number {
	let hash = 0;
	for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) | 0;
	return ((Math.abs(hash) % 7) - 3) * 0.45;
}
