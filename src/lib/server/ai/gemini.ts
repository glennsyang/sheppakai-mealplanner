import { GoogleGenAI, Type } from '@google/genai';
import type { MealSuggestion } from '$lib/types';
import { logger } from '$lib/logger';
import { GEMINI_API_KEY } from '$env/static/private';

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL = 'gemini-3-flash-preview';

const SYSTEM_PROMPT = `You are a home cooking assistant specializing in dinner recipes.
Your job is to suggest practical, delicious dinner recipes based on ingredients the user has available.
Focus on dinner meals only (not breakfast or lunch).
Prefer recipes that use the provided pantry ingredients, but you may suggest additional common pantry staples if needed.
Keep recipes realistic for a home cook — no obscure techniques or equipment.
Always return exactly 3 to 5 suggestions.`;

const responseSchema = {
  type: Type.OBJECT,
  required: ['suggestions'],
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          'name',
          'description',
          'ingredients',
          'steps',
          'prepTimeMinutes',
          'servings',
        ],
        properties: {
          name: { type: Type.STRING, description: 'Name of the dinner dish' },
          description: {
            type: Type.STRING,
            description: 'Short appetizing description (1-2 sentences)',
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
                  description: 'e.g. cups, tbsp, g, pieces',
                },
              },
            },
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Step-by-step cooking instructions',
          },
          prepTimeMinutes: {
            type: Type.NUMBER,
            description: 'Total prep + cook time in minutes',
          },
          servings: { type: Type.NUMBER, description: 'Number of servings' },
        },
      },
    },
  },
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

export async function suggestMeals(
  pantryItems: string[],
): Promise<MealSuggestion[]> {
  logger.info('Requesting meal suggestions from Gemini', {
    itemCount: pantryItems.length,
  });

  const response = await withRetry(() =>
    client.models.generateContent({
      model: MODEL,
      contents: `Please suggest 3-5 dinner recipes I can make with these pantry items: ${pantryItems.join(', ')}.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
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
    count: parsed.suggestions.length,
  });
  return parsed.suggestions;
}

export async function* suggestMealsStream(
  pantryItems: string[],
): AsyncGenerator<MealSuggestion> {
  logger.info('Starting streaming meal suggestions from Gemini', {
    itemCount: pantryItems.length,
  });

  const stream = await withRetry(() =>
    client.models.generateContentStream({
      model: MODEL,
      contents: `Please suggest 3-5 dinner recipes I can make with these pantry items: ${pantryItems.join(', ')}.`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  );

  let jsonBuffer = '';
  for await (const chunk of stream) {
    jsonBuffer += chunk.text ?? '';
  }

  const parsed = JSON.parse(jsonBuffer) as SuggestMealsOutput;
  for (const suggestion of parsed.suggestions) {
    yield suggestion;
  }
}

export { type MealSuggestion, type Ingredient } from '$lib/types';
