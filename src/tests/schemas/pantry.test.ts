import { describe, expect, it } from 'vitest';

import { suggestFromPantrySchema } from '../../lib/schemas/pantry';

describe('suggestFromPantrySchema', () => {
	it('accepts a valid list of items', () => {
		const result = suggestFromPantrySchema.safeParse({ items: ['chicken', 'rice'] });
		expect(result.success).toBe(true);
	});

	it('rejects an empty list', () => {
		const result = suggestFromPantrySchema.safeParse({ items: [] });
		expect(result.success).toBe(false);
	});

	it('rejects more than 15 items', () => {
		const items = Array.from({ length: 16 }, (_, i) => `item-${i}`);
		const result = suggestFromPantrySchema.safeParse({ items });
		expect(result.success).toBe(false);
	});

	it('accepts exactly 15 items', () => {
		const items = Array.from({ length: 15 }, (_, i) => `item-${i}`);
		const result = suggestFromPantrySchema.safeParse({ items });
		expect(result.success).toBe(true);
	});

	it('rejects an item longer than 100 characters', () => {
		const result = suggestFromPantrySchema.safeParse({ items: ['a'.repeat(101)] });
		expect(result.success).toBe(false);
	});
});
