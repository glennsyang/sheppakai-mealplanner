import { beforeEach, describe, expect, it, vi } from 'vitest';

const { anthropicCreate, geminiGenerate, loggerMock } = vi.hoisted(() => ({
	anthropicCreate: vi.fn<() => Promise<unknown>>(),
	geminiGenerate: vi.fn<() => Promise<unknown>>(),
	loggerMock: {
		debug: vi.fn<() => void>(),
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

vi.mock('$app/env/private', () => ({ ANTHROPIC_API_KEY: 'test', GEMINI_API_KEY: 'test' }));
vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));
vi.mock('@anthropic-ai/sdk', () => ({
	default: class {
		messages = { create: anthropicCreate };
	}
}));
vi.mock('@google/genai', () => ({
	GoogleGenAI: class {
		models = { generateContent: geminiGenerate };
	},
	Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER' }
}));

import {
	mealSuggestionSchema,
	pickValidSuggestions,
	saveRecipeSchema
} from '../../lib/schemas/mealPlan';
import { suggestVariations } from '../../lib/server/ai/claude';
import { suggestMeals } from '../../lib/server/ai/gemini';

const valid = {
	name: 'Chicken Curry',
	description: 'Warm and spicy.',
	ingredients: [{ name: 'chicken', quantity: '500', unit: 'g' }],
	steps: ['Brown the chicken', 'Simmer'],
	prepTimeMinutes: 40,
	servings: 4
};

beforeEach(() => vi.clearAllMocks());

describe('mealSuggestionSchema (#171)', () => {
	it('accepts a well-formed suggestion and rounds fractional numbers', () => {
		expect(mealSuggestionSchema.parse({ ...valid, prepTimeMinutes: 37.5 }).prepTimeMinutes).toBe(
			38
		);
	});

	it.each([
		['missing steps', { ...valid, steps: undefined }],
		['ingredient missing unit', { ...valid, ingredients: [{ name: 'x', quantity: '1' }] }],
		['string prep time', { ...valid, prepTimeMinutes: '40' }],
		['zero servings', { ...valid, servings: 0 }],
		['overlong name', { ...valid, name: 'x'.repeat(201) }],
		['too many steps', { ...valid, steps: Array(51).fill('step') }]
	])('rejects %s', (_label, input) => {
		expect(mealSuggestionSchema.safeParse(input).success).toBe(false);
	});

	it('anything it accepts also passes saveRecipe validation', () => {
		const s = mealSuggestionSchema.parse(valid);
		const result = saveRecipeSchema.safeParse({
			name: s.name,
			description: s.description,
			ingredientsJson: JSON.stringify(s.ingredients),
			instructionsJson: JSON.stringify(s.steps),
			prepTimeMinutes: s.prepTimeMinutes,
			servings: s.servings
		});
		expect(result.success).toBe(true);
	});

	it('pickValidSuggestions keeps valid items and counts the rest', () => {
		expect(pickValidSuggestions([valid, { name: 'bad' }, null])).toEqual({
			suggestions: [valid],
			rejected: 2
		});
		expect(pickValidSuggestions('nope')).toEqual({ suggestions: [], rejected: 0 });
	});
});

describe('suggestMeals (Gemini) validates model output (#171)', () => {
	it('drops malformed suggestions and logs a warning', async () => {
		geminiGenerate.mockResolvedValue({
			text: JSON.stringify({ suggestions: [valid, { ...valid, steps: 'not an array' }] })
		});

		await expect(suggestMeals(['chicken'])).resolves.toEqual([valid]);
		expect(loggerMock.warn).toHaveBeenCalledWith(
			'Dropped malformed AI suggestions',
			expect.objectContaining({ rejected: 1, kept: 1 })
		);
	});

	it.each([
		['non-JSON text', 'not json'],
		['no valid items', JSON.stringify({ suggestions: [{ name: 'x' }] })],
		['missing array', JSON.stringify({ meals: [valid] })]
	])('throws on %s', async (_label, text) => {
		geminiGenerate.mockResolvedValue({ text });
		await expect(suggestMeals(['chicken'])).rejects.toThrow('Invalid response structure from AI');
	});
});

describe('suggestVariations (Claude) validates tool input (#171)', () => {
	const toolResponse = (input: unknown) => ({
		content: [{ type: 'tool_use', name: 'suggest_variations', input }]
	});

	it('returns only valid variations', async () => {
		anthropicCreate.mockResolvedValue(
			toolResponse({ variations: [valid, { ...valid, servings: 'four' }] })
		);
		await expect(suggestVariations('Curry')).resolves.toEqual([valid]);
	});

	it('throws when nothing valid comes back', async () => {
		anthropicCreate.mockResolvedValue(toolResponse({ variations: [{ name: 'x' }] }));
		await expect(suggestVariations('Curry')).rejects.toThrow('Invalid response structure from AI');
	});
});
