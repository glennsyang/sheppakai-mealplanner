import { z } from 'zod';

export const addMealPlanEntrySchema = z.object({
	weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	dayOfWeek: z.coerce.number().int().min(0).max(6)
});

export const removeMealPlanEntrySchema = z.object({
	entryId: z.string().min(1, 'Entry ID is required')
});

export const saveRecipeSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().min(1, 'Description is required'),
	ingredientsJson: z.string().min(1, 'Ingredients are required'),
	instructionsJson: z.string().min(1, 'Instructions are required'),
	prepTimeMinutes: z.coerce.number().int().positive(),
	servings: z.coerce.number().int().positive()
});

export const addCustomMealSchema = z.object({
	name: z.string().min(1, 'Meal name is required').max(200),
	notes: z.string().max(2000).optional().default(''),
	weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	dayOfWeek: z.coerce.number().int().min(0).max(6)
});
