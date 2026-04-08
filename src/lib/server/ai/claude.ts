import Anthropic from '@anthropic-ai/sdk';
import type { MealSuggestion } from '$lib/types';
import { logger } from '$lib/logger';

import { getEnv } from '../../../env';
const env = getEnv();

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a home cooking assistant specializing in dinner recipes.
Your job is to suggest practical, delicious dinner recipes based on ingredients the user has available.
Focus on dinner meals only (not breakfast or lunch).
Keep recipes realistic for a home cook — no obscure techniques or equipment.
Always return exactly the requested number of suggestions using the suggest_meals tool.

The following staples are ALWAYS assumed to be in the pantry — you do not need to be told they are available, and you should freely use them in any recipe:
- Salt, black pepper, and common spices (cumin, paprika, chilli flakes, oregano, coriander, turmeric, cinnamon, etc.)
- Fresh aromatics: garlic, ginger, onion, shallots
- Cooking oils and fats: olive oil, vegetable oil, butter
- Pantry staples: flour, sugar, soy sauce, vinegar (white, red wine, apple cider), stock/broth (chicken, vegetable, beef), canned tomatoes, tomato paste
- Condiments: Dijon mustard, hot sauce, Worcestershire sauce
- Dried herbs: thyme, rosemary, bay leaves, basil
- Dairy basics: eggs, milk, cream

Focus suggestions on making good use of the specific pantry items the user provides — those are the ingredients they want to use up.`;

const mealSuggestionTool: Anthropic.Tool = {
  name: 'suggest_meals',
  description:
    'Returns a list of dinner meal suggestions with full recipes based on available pantry items.',
  input_schema: {
    type: 'object' as const,
    required: ['suggestions'],
    properties: {
      suggestions: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object',
          required: [
            'name',
            'description',
            'ingredients',
            'steps',
            'prepTimeMinutes',
            'servings',
          ],
          properties: {
            name: { type: 'string', description: 'Name of the dinner dish' },
            description: {
              type: 'string',
              description: 'Short appetizing description (1-2 sentences)',
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
                    description: 'e.g. cups, tbsp, g, pieces',
                  },
                },
              },
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Step-by-step cooking instructions',
            },
            prepTimeMinutes: {
              type: 'number',
              description: 'Total prep + cook time in minutes',
            },
            servings: { type: 'number', description: 'Number of servings' },
          },
        },
      },
    },
  },
};

interface SuggestMealsInput {
  suggestions: MealSuggestion[];
}

export async function suggestMeals(
  pantryItems: string[],
): Promise<MealSuggestion[]> {
  logger.info('Requesting meal suggestions', { itemCount: pantryItems.length });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [mealSuggestionTool],
    tool_choice: { type: 'tool', name: 'suggest_meals' },
    messages: [
      {
        role: 'user',
        content: `Please suggest 3-5 dinner recipes I can make with these pantry items: ${pantryItems.join(', ')}.`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (toolUse?.type !== 'tool_use') {
    logger.error('Claude did not return tool_use block');
    throw new Error('No meal suggestions returned from AI');
  }

  const input = toolUse.input as SuggestMealsInput;

  if (!Array.isArray(input.suggestions)) {
    logger.error('Claude tool_use input missing suggestions array', { input });
    throw new Error('Invalid response structure from AI');
  }

  logger.info('Meal suggestions received', { count: input.suggestions.length });
  return input.suggestions;
}

export async function* suggestMealsStream(
  pantryItems: string[],
): AsyncGenerator<MealSuggestion> {
  logger.info('Starting streaming meal suggestions', {
    itemCount: pantryItems.length,
  });

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [mealSuggestionTool],
    tool_choice: { type: 'tool', name: 'suggest_meals' },
    messages: [
      {
        role: 'user',
        content: `Please suggest 3-5 dinner recipes I can make with these pantry items: ${pantryItems.join(', ')}.`,
      },
    ],
  });

  let jsonBuffer = '';

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'input_json_delta'
    ) {
      jsonBuffer += event.delta.partial_json;
    }
  }

  // Parse the accumulated JSON
  const parsed = JSON.parse(jsonBuffer) as SuggestMealsInput;
  for (const suggestion of parsed.suggestions) {
    yield suggestion;
  }
}

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
          required: [
            'name',
            'description',
            'ingredients',
            'steps',
            'prepTimeMinutes',
            'servings',
          ],
          properties: {
            name: { type: 'string', description: 'Name of the variation' },
            description: {
              type: 'string',
              description: 'Short appetizing description (1-2 sentences)',
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
                    description: 'e.g. cups, tbsp, g, pieces',
                  },
                },
              },
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Step-by-step cooking instructions',
            },
            prepTimeMinutes: {
              type: 'number',
              description: 'Total prep + cook time in minutes',
            },
            servings: { type: 'number', description: 'Number of servings' },
          },
        },
      },
    },
  },
};

interface SuggestVariationsInput {
  variations: MealSuggestion[];
}

export async function suggestVariations(
  mealName: string,
): Promise<MealSuggestion[]> {
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
        content: `Please suggest 2-3 distinct recipe variations for: ${mealName}.`,
      },
    ],
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

export { type MealSuggestion, type Ingredient } from '$lib/types';
