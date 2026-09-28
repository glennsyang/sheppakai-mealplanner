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
