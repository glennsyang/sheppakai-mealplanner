import { ANTHROPIC_API_KEY } from '$app/env/private';
import { logger } from '$lib/server/logger';
import type { MealSuggestion } from '$lib/types';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
	apiKey: ANTHROPIC_API_KEY
});

const VARIATIONS_SYSTEM_PROMPT = `You are a home cooking assistant specializing in dinner recipes.
Your job is to suggest 2-3 distinct recipe variations for a named dish.
Each variation should differ meaningfully — for example, different protein, cooking method, regional style, or dietary adaptation.
Keep recipes realistic for a home cook — no obscure techniques or equipment.
Always return exactly the requested variations using the suggest_variations tool.`;

const variationsTool: Anthropic.Tool = {
	name: 'suggest_variations',
	description: 'Returns 2-3 distinct recipe variations for a given dish name.',
	input_schema: {
		type: 'object' as const,
		required: ['variations'],
		properties: {
			variations: {
				type: 'array',
				minItems: 2,
				maxItems: 3,
				items: {
					type: 'object',
					required: ['name', 'description', 'ingredients', 'steps', 'prepTimeMinutes', 'servings'],
					properties: {
						name: { type: 'string', description: 'Name of the variation' },
						description: {
							type: 'string',
							description: 'Short appetizing description (1-2 sentences)'
						},
						ingredients: {
							type: 'array',
							items: {
								type: 'object',
								required: ['name', 'quantity', 'unit'],
								properties: {
									name: { type: 'string' },
									quantity: { type: 'string' },
									unit: {
										type: 'string',
										description: 'e.g. cups, tbsp, g, pieces'
									}
								}
							}
						},
						steps: {
							type: 'array',
							items: { type: 'string' },
							description: 'Step-by-step cooking instructions'
						},
						prepTimeMinutes: {
							type: 'number',
							description: 'Total prep + cook time in minutes'
						},
						servings: { type: 'number', description: 'Number of servings' }
					}
				}
			}
		}
	}
};

interface SuggestVariationsInput {
	variations: MealSuggestion[];
}

export async function suggestVariations(mealName: string): Promise<MealSuggestion[]> {
	logger.info('Requesting meal variations', { mealName });

	const response = await client.messages.create({
		model: 'claude-sonnet-4-6',
		max_tokens: 4096,
		system: VARIATIONS_SYSTEM_PROMPT,
		tools: [variationsTool],
		tool_choice: { type: 'tool', name: 'suggest_variations' },
		messages: [
			{
				role: 'user',
				content: `Please suggest 2-3 distinct recipe variations for: ${mealName}.`
			}
		]
	});

	const toolUse = response.content.find((block) => block.type === 'tool_use');
	if (toolUse?.type !== 'tool_use') {
		logger.error('Claude did not return tool_use block for variations');
		throw new Error('No variations returned from AI');
	}

	const input = toolUse.input as SuggestVariationsInput;

	if (!Array.isArray(input.variations)) {
		logger.error('Claude tool_use input missing variations array', { input });
		throw new Error('Invalid response structure from AI');
	}

	logger.info('Meal variations received', { count: input.variations.length });
	return input.variations;
}

export { type MealSuggestion } from '$lib/types';
