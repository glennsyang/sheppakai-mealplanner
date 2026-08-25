import { GEMINI_API_KEY } from '$app/env/private';
import { logger } from '$lib/server/logger';
import type { MealSuggestion } from '$lib/types';
import { GoogleGenAI, Type } from '@google/genai';

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You are a home cooking assistant specializing in dinner recipes.
Your job is to suggest practical, delicious dinner recipes based on ingredients the user has available.
Focus on dinner meals only (not breakfast or lunch).
Keep recipes realistic for a home cook — no obscure techniques or equipment.
Always return exactly 3 to 5 suggestions.

The following staples are ALWAYS assumed to be in the pantry — you do not need to be told they are available, and you should freely use them in any recipe:
- Salt, black pepper, and common spices (cumin, paprika, chilli flakes, oregano, coriander, turmeric, cinnamon, etc.)
- Fresh aromatics: garlic, ginger, onion
- Cooking oils and fats: olive oil, vegetable oil, butter
- Pantry staples: flour, sugar, soy sauce, vinegar (white, apple cider), chicken stock/broth, canned tomatoes, tomato paste
- Condiments: Dijon mustard, hot sauce, Sriracha, mayonnaise
- Dairy basics: eggs, cream

Focus suggestions on making good use of the specific pantry items the user provides — those are the ingredients they want to use up.`;

const responseSchema = {
	type: Type.OBJECT,
	required: ['suggestions'],
	properties: {
		suggestions: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				required: ['name', 'description', 'ingredients', 'steps', 'prepTimeMinutes', 'servings'],
				properties: {
					name: { type: Type.STRING, description: 'Name of the dinner dish' },
					description: {
						type: Type.STRING,
						description: 'Short appetizing description (1-2 sentences)'
					},
					ingredients: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							required: ['name', 'quantity', 'unit'],
							properties: {
								name: { type: Type.STRING },
								quantity: { type: Type.STRING },
								unit: {
									type: Type.STRING,
									description: 'e.g. cups, tbsp, g, pieces'
								}
							}
						}
					},
					steps: {
						type: Type.ARRAY,
						items: { type: Type.STRING },
						description: 'Step-by-step cooking instructions'
					},
					prepTimeMinutes: {
						type: Type.NUMBER,
						description: 'Total prep + cook time in minutes'
					},
					servings: { type: Type.NUMBER, description: 'Number of servings' }
				}
			}
		}
	}
};

interface SuggestMealsOutput {
	suggestions: MealSuggestion[];
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			const status = (err as { status?: number }).status;
			if (status === 429 && attempt < maxAttempts) {
				const delayMs = 1000 * 2 ** attempt;
				logger.warn('Gemini rate limited, retrying', { attempt, delayMs });
				await new Promise((resolve) => setTimeout(resolve, delayMs));
				continue;
			}
			const message = (err as { message?: string }).message;
			logger.error('Gemini API error', { status, message, attempt });
			throw err;
		}
	}
	throw new Error('Unreachable');
}

export async function suggestMeals(pantryItems: string[]): Promise<MealSuggestion[]> {
	logger.info('Requesting meal suggestions from Gemini', {
		itemCount: pantryItems.length
	});

	const response = await withRetry(() =>
		client.models.generateContent({
			model: MODEL,
			contents: `Please suggest 3-5 dinner recipes I can make with these pantry items: ${pantryItems.join(', ')}.`,
			config: {
				systemInstruction: SYSTEM_PROMPT,
				responseMimeType: 'application/json',
				responseSchema
			}
		})
	);

	const text = response.text;
	if (!text) {
		logger.error('Gemini returned empty response');
		throw new Error('No meal suggestions returned from AI');
	}

	const parsed = JSON.parse(text) as SuggestMealsOutput;

	if (!Array.isArray(parsed.suggestions)) {
		logger.error('Gemini response missing suggestions array', { parsed });
		throw new Error('Invalid response structure from AI');
	}

	logger.info('Meal suggestions received', {
		count: parsed.suggestions.length
	});
	return parsed.suggestions;
}

export { type MealSuggestion } from '$lib/types';
