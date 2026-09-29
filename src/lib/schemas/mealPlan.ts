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

export const suggestVariationsSchema = z.object({
	meal: z.string().trim().min(1, 'Meal name is required').max(200, 'Meal name too long')
});
