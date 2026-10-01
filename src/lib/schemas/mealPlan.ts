import { z } from 'zod';

export const addMealPlanEntrySchema = z.object({
	weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	dayOfWeek: z.coerce.number().int().min(0).max(6)
});

export const removeMealPlanEntrySchema = z.object({
	entryId: z.string().min(1, 'Entry ID is required')
});

// Caps the raw form string before JSON.parse so oversized bodies are never parsed.
const MAX_RECIPE_JSON_LENGTH = 20_000;

const ingredientSchema = z.object({
	name: z.string().max(200),
	quantity: z.string().max(50),
	unit: z.string().max(50)
});

// Bounds for newly saved recipes. Empty arrays are valid: custom meals are stored
// without ingredients or instructions.
const ingredientListSchema = z.array(ingredientSchema).max(50);
const instructionListSchema = z.array(z.string().max(2000)).max(50);

// Shape-only checks for rows already in recipes.ingredients_json / instructions_json,
// which may predate the bounds above.
export const storedIngredientListSchema = z.array(
	z.object({ name: z.string(), quantity: z.string(), unit: z.string() })
);
export const storedInstructionListSchema = z.array(z.string());

function jsonList<T extends z.ZodType>(schema: T) {
	return z
		.string()
		.max(MAX_RECIPE_JSON_LENGTH)
		.transform((raw, ctx) => {
			try {
				return JSON.parse(raw) as unknown;
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
				return z.NEVER;
			}
		})
		.pipe(schema);
}

// Parse the validated saveRecipeSchema strings into arrays. Kept separate because
// superforms rejects form fields whose output type is an array of objects.
export const ingredientsJsonSchema = jsonList(ingredientListSchema);
export const instructionsJsonSchema = jsonList(instructionListSchema);

export const saveRecipeSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	description: z.string().min(1, 'Description is required').max(2000),
	ingredientsJson: z
		.string()
		.min(1, 'Ingredients are required')
		.refine((raw) => ingredientsJsonSchema.safeParse(raw).success, 'Invalid ingredients'),
	instructionsJson: z
		.string()
		.min(1, 'Instructions are required')
		.refine((raw) => instructionsJsonSchema.safeParse(raw).success, 'Invalid instructions'),
	prepTimeMinutes: z.coerce.number().int().positive(),
	servings: z.coerce.number().int().positive()
});

export const addCustomMealSchema = z.object({
	name: z.string().min(1, 'Meal name is required').max(200),
	notes: z.string().max(2000).optional().default(''),
	weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	dayOfWeek: z.coerce.number().int().min(0).max(6)
});

// Shape of one AI meal suggestion. Model output and client-side JSON (API responses,
// sessionStorage) are untrusted, so they're parsed against this rather than cast. Bounds
// match what saveAndAdd accepts, so a suggestion that passes here can always be saved.
// Models occasionally return fractional minutes/servings; round rather than discard.
const wholePositive = z
	.number()
	.positive()
	.transform((n) => Math.max(1, Math.round(n)));

export const mealSuggestionSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().min(1).max(2000),
	ingredients: ingredientListSchema,
	steps: instructionListSchema,
	prepTimeMinutes: wholePositive,
	servings: wholePositive
});

export const mealSuggestionListSchema = z.array(mealSuggestionSchema);

/**
 * Keep the valid suggestions from untrusted model output, so one malformed item doesn't
 * sink the whole response. Callers decide what an empty result means.
 */
export function pickValidSuggestions(raw: unknown): {
	suggestions: z.output<typeof mealSuggestionSchema>[];
	rejected: number;
} {
	const items: unknown[] = Array.isArray(raw) ? raw : [];
	const suggestions = items.flatMap((item) => {
		const result = mealSuggestionSchema.safeParse(item);
		return result.success ? [result.data] : [];
	});
	return { suggestions, rejected: items.length - suggestions.length };
}

export const suggestVariationsSchema = z.object({
	meal: z.string().trim().min(1, 'Meal name is required').max(200, 'Meal name too long')
});
