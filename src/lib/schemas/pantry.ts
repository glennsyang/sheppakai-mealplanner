import { z } from 'zod';

export const addPantryItemSchema = z.object({
	name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
	quantity: z.coerce.number().positive().nullable().optional(),
	unit: z.string().max(30, 'Unit too long').nullable().optional()
});

export const removePantryItemSchema = z.object({
	id: z.string().min(1, 'Item ID is required')
});

export const suggestFromPantrySchema = z.object({
	items: z
		.array(z.string().trim().min(1).max(100, 'Item name too long'))
		.min(1, 'Select at least one item')
		.max(15, 'Too many items selected')
});
