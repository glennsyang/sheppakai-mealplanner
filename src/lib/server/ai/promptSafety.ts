/**
 * Sanitizes user-supplied text before it's interpolated into an LLM prompt: collapses
 * all whitespace (including newlines/tabs, a common fake-turn injection vector) to a
 * single space, strips remaining control characters, and trims. Throws if the result
 * is empty or exceeds maxLength. Callers should already validate this at the API
 * boundary (see src/lib/schemas) — this is a defense-in-depth backstop so the AI
 * modules stay safe regardless of caller.
 */
export function sanitizePromptText(text: string, maxLength: number): string {
	const sanitized = text
		.replace(/\s+/g, ' ')
		.replace(/[\p{Cc}]/gu, '')
		.trim();

	if (!sanitized) {
		throw new Error('Prompt text is empty after sanitization');
	}
	if (sanitized.length > maxLength) {
		throw new Error(`Prompt text exceeds maximum length of ${maxLength}`);
	}

	return sanitized;
}
