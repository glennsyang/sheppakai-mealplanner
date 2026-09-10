import { createAuthLoadForm, redirectIfAuthenticated } from '$lib/server/auth/form-helpers';
import { isRedirect } from '@sveltejs/kit';
import type { Redirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const schema = z.object({ email: z.string() });

const at = (path: string) => new URL(`https://example.com${path}`);

describe('redirectIfAuthenticated', () => {
	it('throws a redirect to the post-login route when a user is present', () => {
		let caught: unknown;
		try {
			redirectIfAuthenticated({ id: 'user_1' } as App.Locals['user']);
		} catch (e) {
			caught = e;
		}

		expect(isRedirect(caught)).toBe(true);
		expect((caught as Redirect).location).toBe('/');
	});

	it('does nothing when the user is null or undefined', () => {
		expect(() => redirectIfAuthenticated(null as App.Locals['user'])).not.toThrow();
		expect(() => redirectIfAuthenticated(undefined as unknown as App.Locals['user'])).not.toThrow();
	});
});

describe('createAuthLoadForm', () => {
	it('returns a superforms object with no banner by default', async () => {
		const form = await createAuthLoadForm(schema, at('/sign-in'));
		expect(form.message).toBeUndefined();
	});

	it('surfaces a redirect-carried ?message as an error banner', async () => {
		const form = await createAuthLoadForm(schema, at('/sign-in?message=Please%20sign%20in'));
		expect(form.message).toEqual({ type: 'error', text: 'Please sign in' });
	});

	it('strips HTML tags from the query message', async () => {
		const form = await createAuthLoadForm(schema, at('/sign-in?message=%3Cb%3Ehi%3C%2Fb%3Ethere'));
		expect(form.message).toEqual({ type: 'error', text: 'hithere' });
	});

	it('strips an unterminated tag (no dangling <script)', async () => {
		const form = await createAuthLoadForm(schema, at('/sign-in?message=hi%20%3Cscript'));
		const text = (form.message as App.Superforms.Message).text;
		expect(text).not.toContain('<');
		expect(text).toBe('hi ');
	});

	it('truncates the query message to 200 characters', async () => {
		const long = 'x'.repeat(300);
		const form = await createAuthLoadForm(schema, at(`/sign-in?message=${long}`));
		expect((form.message as App.Superforms.Message).text).toHaveLength(200);
	});

	it('ignores the query message when includeQueryMessage is false', async () => {
		const form = await createAuthLoadForm(schema, at('/reset-password?message=nope'), {
			includeQueryMessage: false
		});
		expect(form.message).toBeUndefined();
	});

	it('honours a custom messageParam', async () => {
		const form = await createAuthLoadForm(schema, at('/sign-in?flash=Hello'), {
			messageParam: 'flash'
		});
		expect(form.message).toEqual({ type: 'error', text: 'Hello' });
	});
});
