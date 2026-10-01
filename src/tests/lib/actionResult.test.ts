import { describe, expect, it } from 'vitest';

import { actionFailureText } from '../../lib/action-result';

describe('actionFailureText (#167)', () => {
	it('returns the superforms message text from a failure', () => {
		expect(
			actionFailureText(
				{
					type: 'failure',
					status: 500,
					data: { form: { message: { type: 'error', text: 'Could not remove' } } }
				},
				'fallback'
			)
		).toBe('Could not remove');
	});

	it.each([
		{ type: 'failure', status: 401, data: { error: 'Unauthorized' } },
		{ type: 'failure', status: 400, data: { form: { valid: false } } },
		{ type: 'error', error: new Error('boom') },
		{ type: 'redirect', status: 303, location: '/sign-in' }
	] as const)('falls back for %o', (result) => {
		expect(actionFailureText(result, 'fallback')).toBe('fallback');
	});
});
