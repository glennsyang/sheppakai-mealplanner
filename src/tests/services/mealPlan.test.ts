import { describe, it, expect } from 'vitest';

import { getMondayOfCurrentWeek } from '../../lib/server/services/mealPlan';

describe('getMondayOfCurrentWeek', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getMondayOfCurrentWeek();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a Monday (day 1 in JS or computed correctly)', () => {
    const result = getMondayOfCurrentWeek();
    // Parse as local date components to avoid timezone shifting
    const [year, month, day] = result.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // JavaScript getDay(): 0=Sunday, 1=Monday
    expect(date.getDay()).toBe(1);
  });

  it('returns the same date on consecutive calls within the same day', () => {
    const a = getMondayOfCurrentWeek();
    const b = getMondayOfCurrentWeek();
    expect(a).toBe(b);
  });
});

describe('addMealPlanEntrySchema', () => {
  it('validates correct entry data', async () => {
    const { addMealPlanEntrySchema } = await import('../../lib/schemas/mealPlan');
    const result = addMealPlanEntrySchema.safeParse({
      weekStartDate: '2026-03-02',
      dayOfWeek: 0,
      recipeId: 'some-recipe-id',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid day of week', async () => {
    const { addMealPlanEntrySchema } = await import('../../lib/schemas/mealPlan');
    const result = addMealPlanEntrySchema.safeParse({
      weekStartDate: '2026-03-02',
      dayOfWeek: 7,
      recipeId: 'some-recipe-id',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed date', async () => {
    const { addMealPlanEntrySchema } = await import('../../lib/schemas/mealPlan');
    const result = addMealPlanEntrySchema.safeParse({
      weekStartDate: 'not-a-date',
      dayOfWeek: 0,
      recipeId: 'some-recipe-id',
    });
    expect(result.success).toBe(false);
  });
});
