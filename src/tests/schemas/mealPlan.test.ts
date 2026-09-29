import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { describe, expect, it } from 'vitest';

import {
	ingredientsJsonSchema,
	instructionsJsonSchema,
	saveRecipeSchema,
	storedIngredientListSchema,
	suggestVariationsSchema
} from '../../lib/schemas/mealPlan';

describe('suggestVariationsSchema', () => {
	it('accepts a valid meal name', () => {
		const result = suggestVariationsSchema.safeParse({ meal: 'Chicken Stir Fry' });
		expect(result.success).toBe(true);
	});

	it('rejects an empty meal name', () => {
		const result = suggestVariationsSchema.safeParse({ meal: '' });
		expect(result.success).toBe(false);
	});

	it('rejects a meal name longer than 200 characters', () => {
		const result = suggestVariationsSchema.safeParse({ meal: 'a'.repeat(201) });
		expect(result.success).toBe(false);
	});

	it('accepts a meal name at exactly 200 characters', () => {
		const result = suggestVariationsSchema.safeParse({ meal: 'a'.repeat(200) });
		expect(result.success).toBe(true);
	});
});

describe('saveRecipeSchema', () => {
	const ingredient = { name: 'Rice', quantity: '1', unit: 'cup' };
	const valid = {
		name: 'Fried Rice',
		description: 'Quick weeknight fried rice',
		ingredientsJson: JSON.stringify([ingredient]),
		instructionsJson: JSON.stringify(['Cook rice', 'Fry it']),
		prepTimeMinutes: '20',
		servings: '2'
	};

	it('accepts a valid payload whose JSON fields parse to arrays', () => {
		expect(saveRecipeSchema.safeParse(valid).success).toBe(true);
		expect(ingredientsJsonSchema.parse(valid.ingredientsJson)).toEqual([ingredient]);
		expect(instructionsJsonSchema.parse(valid.instructionsJson)).toEqual(['Cook rice', 'Fry it']);
	});

	it('accepts empty ingredient and instruction lists', () => {
		const result = saveRecipeSchema.safeParse({
			...valid,
			ingredientsJson: '[]',
			instructionsJson: '[]'
		});
		expect(result.success).toBe(true);
	});

	it('rejects a name longer than 200 characters', () => {
		expect(saveRecipeSchema.safeParse({ ...valid, name: 'a'.repeat(201) }).success).toBe(false);
	});

	it('rejects a description longer than 2000 characters', () => {
		const result = saveRecipeSchema.safeParse({
			...valid,
			description: 'a'.repeat(2001)
		});
		expect(result.success).toBe(false);
	});

	it.each([
		['malformed JSON', '[{'],
		['a non-array', '{}'],
		['an ingredient missing unit', JSON.stringify([{ name: 'Rice', quantity: '1' }])],
		['more than 50 ingredients', JSON.stringify(Array(51).fill(ingredient))],
		['an oversized ingredient name', JSON.stringify([{ ...ingredient, name: 'a'.repeat(201) }])],
		[
			'a raw string over 20000 characters',
			JSON.stringify([{ ...ingredient, name: 'a'.repeat(20_000) }])
		]
	])('rejects ingredientsJson with %s', (_, ingredientsJson) => {
		expect(saveRecipeSchema.safeParse({ ...valid, ingredientsJson }).success).toBe(false);
	});

	it.each([
		['a non-string step', JSON.stringify([1])],
		['more than 50 steps', JSON.stringify(Array(51).fill('Stir'))],
		['a step longer than 2000 characters', JSON.stringify(['a'.repeat(2001)])]
	])('rejects instructionsJson with %s', (_, instructionsJson) => {
		expect(saveRecipeSchema.safeParse({ ...valid, instructionsJson }).success).toBe(false);
	});

	it('works with the superforms zod4 adapter', async () => {
		const formData = new FormData();
		for (const [key, value] of Object.entries(valid)) formData.set(key, value);
		const form = await superValidate(formData, zod4(saveRecipeSchema));
		expect(form.valid).toBe(true);

		formData.set('ingredientsJson', '{}');
		const invalid = await superValidate(formData, zod4(saveRecipeSchema));
		expect(invalid.valid).toBe(false);
	});
});

describe('storedIngredientListSchema', () => {
	it('accepts rows that exceed the save-time bounds', () => {
		const rows = Array(60).fill({
			name: 'a'.repeat(300),
			quantity: '1',
			unit: 'g'
		});
		expect(storedIngredientListSchema.safeParse(rows).success).toBe(true);
	});

	it('rejects a non-array', () => {
		expect(storedIngredientListSchema.safeParse({}).success).toBe(false);
	});
});
