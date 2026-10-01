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
import {
	actions as plannerActions,
	load as plannerLoad
} from '../../routes/(app)/planner/+page.server';

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

describe('planner load: ?week= validation (#165)', () => {
	const loadCtx = (search: string) =>
		({
			request: new Request(`https://example.com/planner${search}`),
			url: new URL(`https://example.com/planner${search}`),
			route: { id: '/(app)/planner' }
		}) as never;

	beforeEach(() => {
		mealPlanMock.getMealPlanWithEntries.mockResolvedValue([]);
	});

	it('defaults to the current week when ?week= is absent', async () => {
		const data = (await plannerLoad(loadCtx(''))) as { weekStartDate: string };
		expect(data.weekStartDate).toBe('2026-09-28');
		expect(mealPlanMock.getMealPlanWithEntries).toHaveBeenCalledWith('2026-09-28');
	});

	it('accepts a Monday', async () => {
		const data = (await plannerLoad(loadCtx('?week=2026-10-05'))) as { weekStartDate: string };
		expect(data.weekStartDate).toBe('2026-10-05');
	});

	it('redirects a non-Monday date to that week’s Monday', async () => {
		await expect(plannerLoad(loadCtx('?week=2026-10-04'))).rejects.toMatchObject({
			status: 302,
			location: '/planner?week=2026-09-28'
		});
		expect(mealPlanMock.getMealPlanWithEntries).not.toHaveBeenCalled();
	});

	it.each(['garbage', '2026-02-30', '<script>'])(
		'redirects an invalid ?week=%s to the current week',
		async (week) => {
			await expect(plannerLoad(loadCtx(`?week=${encodeURIComponent(week)}`))).rejects.toMatchObject(
				{ status: 302, location: '/planner' }
			);
			expect(mealPlanMock.getMealPlanWithEntries).not.toHaveBeenCalled();
		}
	);
});
