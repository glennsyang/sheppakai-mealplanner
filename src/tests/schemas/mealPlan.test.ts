import { describe, expect, it } from 'vitest';

import { suggestVariationsSchema } from '../../lib/schemas/mealPlan';

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
