import { handleAuthFormAction, invalidAuthForm } from '$lib/server/actions/auth-form-handler';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn<() => void>() } }));

const testSchema = z.object({ email: z.string().email() });
const makeForm = () => superValidate(zod4(testSchema));

describe('invalidAuthForm', () => {
	it('returns a 400 form failure carrying an error banner', async () => {
		const form = await makeForm();

		expect(invalidAuthForm(form)).toMatchObject({
			status: 400,
			data: {
				form: expect.objectContaining({
					valid: false,
					message: { type: 'error', text: 'Please correct the errors in the form.' }
				})
			}
		});
	});

	it('honours a custom message text', async () => {
		const form = await makeForm();

		expect(invalidAuthForm(form, 'That reset link is no longer valid.')).toMatchObject({
			data: {
				form: expect.objectContaining({
					message: { type: 'error', text: 'That reset link is no longer valid.' }
				})
			}
		});
	});
});

describe('handleAuthFormAction', () => {
	it('rethrows redirect errors without converting them to form failures', async () => {
		const form = await makeForm();

		await expect(
			handleAuthFormAction(
				form,
				async () => {
					throw redirect(302, '/');
				},
				{ loggerContext: 'test', fallbackMessage: 'fallback' }
			)
		).rejects.toMatchObject({ status: 302, location: '/' });
	});

	it('returns a 400 form failure with the fallback text for auth errors', async () => {
		const form = await makeForm();

		const result = await handleAuthFormAction(
			form,
			async () => {
				throw new Error('boom');
			},
			{ loggerContext: 'test', fallbackMessage: 'fallback' }
		);

		expect(result).toMatchObject({
			status: 400,
			data: {
				form: expect.objectContaining({
					valid: false,
					message: { type: 'error', text: 'fallback' }
				})
			}
		});
	});

	it('honours errorType so a route can keep failures indistinguishable from successes', async () => {
		const form = await makeForm();

		const result = await handleAuthFormAction(
			form,
			async () => {
				throw new Error('boom');
			},
			{
				loggerContext: 'test',
				fallbackMessage: 'If an account exists with that email, a link is on its way.',
				errorType: 'success'
			}
		);

		expect(result).toMatchObject({
			data: {
				form: expect.objectContaining({
					message: {
						type: 'success',
						text: 'If an account exists with that email, a link is on its way.'
					}
				})
			}
		});
	});

	it('maps a Better Auth error code to its user-facing message', async () => {
		const form = await makeForm();

		const result = await handleAuthFormAction(
			form,
			async () => {
				throw { body: { code: 'INVALID_EMAIL_OR_PASSWORD' } };
			},
			{ loggerContext: 'test', fallbackMessage: 'Sign-in failed' }
		);

		expect(result).toMatchObject({
			data: {
				form: expect.objectContaining({
					message: { type: 'error', text: 'Invalid email or password. Please try again.' }
				})
			}
		});
	});
});
