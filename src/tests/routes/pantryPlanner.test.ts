import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pantryMock, mealPlanMock, recipesMock, loggerMock } = vi.hoisted(() => ({
	pantryMock: {
		listPantryItems: vi.fn<() => Promise<unknown>>(),
		addPantryItem: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
		removePantryItem: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined)
	},
	mealPlanMock: {
		getMealPlanWithEntries: vi.fn<() => Promise<unknown>>(),
		addMealPlanEntry: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
		removeMealPlanEntry: vi.fn<() => Promise<unknown>>().mockResolvedValue(undefined),
		getMondayOfCurrentWeek: vi.fn<() => string>().mockReturnValue('2026-09-28')
	},
	recipesMock: {
		saveRecipe: vi.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'recipe_1' })
	},
	loggerMock: {
		info: vi.fn<() => void>(),
		warn: vi.fn<() => void>(),
		error: vi.fn<() => void>()
	}
}));

vi.mock('$lib/server/services/pantry', () => pantryMock);
vi.mock('$lib/server/services/mealPlan', () => mealPlanMock);
vi.mock('$lib/server/services/recipes', () => recipesMock);
vi.mock('$lib/server/logger', () => ({ logger: loggerMock }));

import { actions as pantryActions } from '../../routes/(app)/pantry/+page.server';
import { actions as plannerActions } from '../../routes/(app)/planner/+page.server';

const USER = { id: 'user_1', name: 'Alice', email: 'alice@example.com', role: 'user' };

function req(fields: Record<string, string>) {
	return new Request('https://example.com/', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

type Locals = Partial<App.Locals>;
const ctx = (locals: Locals, fields: Record<string, string> = {}) =>
	({ request: req(fields), locals }) as never;

const allServiceMocks = [
	...Object.values(pantryMock),
	...Object.values(mealPlanMock),
	...Object.values(recipesMock)
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe('pantry/planner actions: unauthenticated', () => {
	const cases = [
		['pantry add', pantryActions.add, { name: 'Rice' }],
		['pantry remove', pantryActions.remove, { id: 'item_1' }],
		['planner saveAndAdd', plannerActions.saveAndAdd, {}],
		['planner remove', plannerActions.remove, { entryId: 'entry_1' }],
		[
			'planner addCustom',
			plannerActions.addCustom,
			{ name: 'Tacos', weekStartDate: '2026-09-28', dayOfWeek: '1' }
		]
	] as const;

	it.each(cases)('%s returns 401 without touching services', async (_name, action, fields) => {
		const result = await action(ctx({}, fields));

		expect(result).toMatchObject({ status: 401, data: { error: 'Unauthorized' } });
		for (const mock of allServiceMocks) expect(mock).not.toHaveBeenCalled();
	});
});

describe('pantry/planner actions: authenticated', () => {
	it('pantry add passes the session user id to the service', async () => {
		await pantryActions.add(ctx({ user: USER } as Locals, { name: 'Rice' }));

		expect(pantryMock.addPantryItem).toHaveBeenCalledWith('user_1', 'Rice', null, null);
	});

	it('planner addCustom passes the session user id to the services', async () => {
		await plannerActions.addCustom(
			ctx({ user: USER } as Locals, { name: 'Tacos', weekStartDate: '2026-09-28', dayOfWeek: '1' })
		);

		expect(recipesMock.saveRecipe).toHaveBeenCalledWith(
			'user_1',
			expect.objectContaining({ name: 'Tacos', source: 'custom' })
		);
		expect(mealPlanMock.addMealPlanEntry).toHaveBeenCalledWith(
			'user_1',
			'2026-09-28',
			1,
			'recipe_1'
		);
	});
});

describe('pantry/planner actions: consistent { form } results (#166)', () => {
	const recipeFields = {
		weekStartDate: '2026-09-28',
		dayOfWeek: '2',
		name: 'Curry',
		description: 'Spicy',
		ingredientsJson: JSON.stringify([{ name: 'rice', quantity: '1', unit: 'cup' }]),
		instructionsJson: JSON.stringify(['Cook']),
		prepTimeMinutes: '30',
		servings: '2'
	};

	it('saveAndAdd validates recipe + day as one form and saves', async () => {
		const result = await plannerActions.saveAndAdd(ctx({ user: USER } as Locals, recipeFields));

		expect(result).toMatchObject({ form: { valid: true } });
		expect(recipesMock.saveRecipe).toHaveBeenCalledWith(
			'user_1',
			expect.objectContaining({ name: 'Curry', ingredientsJson: [expect.any(Object)] })
		);
		expect(mealPlanMock.addMealPlanEntry).toHaveBeenCalledWith(
			'user_1',
			'2026-09-28',
			2,
			'recipe_1'
		);
	});

	it('saveAndAdd returns fail(400, { form }) for an invalid day', async () => {
		const result = await plannerActions.saveAndAdd(
			ctx({ user: USER } as Locals, { ...recipeFields, dayOfWeek: '9' })
		);

		expect(result).toMatchObject({ status: 400, data: { form: { valid: false } } });
		expect(recipesMock.saveRecipe).not.toHaveBeenCalled();
	});

	it.each([
		[
			'planner saveAndAdd',
			() => recipesMock.saveRecipe.mockRejectedValueOnce(new Error('db down')),
			() => plannerActions.saveAndAdd(ctx({ user: USER } as Locals, recipeFields))
		],
		[
			'planner remove',
			() => mealPlanMock.removeMealPlanEntry.mockRejectedValueOnce(new Error('db down')),
			() => plannerActions.remove(ctx({ user: USER } as Locals, { entryId: 'entry_1' }))
		],
		[
			'planner addCustom',
			() => recipesMock.saveRecipe.mockRejectedValueOnce(new Error('db down')),
			() =>
				plannerActions.addCustom(
					ctx({ user: USER } as Locals, {
						name: 'Tacos',
						weekStartDate: '2026-09-28',
						dayOfWeek: '1'
					})
				)
		],
		[
			'pantry add',
			() => pantryMock.addPantryItem.mockRejectedValueOnce(new Error('db down')),
			() => pantryActions.add(ctx({ user: USER } as Locals, { name: 'Rice' }))
		],
		[
			'pantry remove',
			() => pantryMock.removePantryItem.mockRejectedValueOnce(new Error('db down')),
			() => pantryActions.remove(ctx({ user: USER } as Locals, { id: 'item_1' }))
		]
	])('%s returns fail(500, { form }) with an error message', async (_name, arrange, act) => {
		arrange();
		const result = await act();

		expect(result).toMatchObject({
			status: 500,
			data: { form: { message: { type: 'error', text: expect.any(String) } } }
		});
		expect(loggerMock.error).toHaveBeenCalled();
	});

	it('re-throws SvelteKit redirects instead of swallowing them', async () => {
		const { redirect } = await import('@sveltejs/kit');
		mealPlanMock.removeMealPlanEntry.mockImplementationOnce(() => {
			throw redirect(303, '/sign-in');
		});

		await expect(
			plannerActions.remove(ctx({ user: USER } as Locals, { entryId: 'entry_1' }))
		).rejects.toMatchObject({ status: 303, location: '/sign-in' });
	});
});
