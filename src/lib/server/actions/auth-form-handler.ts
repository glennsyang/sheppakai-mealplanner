// Shared auth-action wrapper. Canonical cross-repo module surface (auth-audit.md §2N,
// glennsyang/sheppakai-budget#438) — kept byte-identical with synapse and
// sheppakai-budget apart from the `getBetterAuthErrorMessage` import specifier
// (this repo: `$lib/server/auth/errors`; budget: `$lib/utils`; synapse:
// `$lib/utils/auth`). Consolidating that module's location is tracked by
// glennsyang/sheppakai-budget#439.

import { getBetterAuthErrorMessage } from '$lib/server/auth/errors';
import { logger } from '$lib/server/logger';
import { isRedirect } from '@sveltejs/kit';
import { message } from 'sveltekit-superforms';
import type { SuperValidated } from 'sveltekit-superforms';

type MessageOptions = NonNullable<Parameters<typeof message>[2]>;

interface AuthFormActionOptions {
	loggerContext: string;
	fallbackMessage: string;
	/**
	 * Banner style for the failure path. Defaults to `'error'`; routes that must
	 * stay indistinguishable between success and failure (see forgot-password,
	 * which hides whether an account exists) pass `'success'` instead.
	 */
	errorType?: App.Superforms.Message['type'];
	status?: MessageOptions['status'];
}

/**
 * The single validation-failure response for auth actions. Superforms turns a
 * `message(...)` with a 4xx status into `fail(status, { form })`, so the page
 * gets field errors *and* a banner from one call — no route needs a bare
 * `fail(...)` and no page has to branch on which shape it received.
 */
export function invalidAuthForm<TForm extends Record<string, unknown>>(
	form: SuperValidated<TForm>,
	text = 'Please correct the errors in the form.'
) {
	return message(form, { type: 'error', text }, { status: 400 });
}

export async function handleAuthFormAction<TForm extends Record<string, unknown>>(
	form: SuperValidated<TForm>,
	action: () => Promise<unknown>,
	options: AuthFormActionOptions
): Promise<unknown> {
	try {
		return await action();
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}

		logger.error(options.loggerContext, error);
		const errorMessage = getBetterAuthErrorMessage(error, options.fallbackMessage);

		return message(
			form,
			{ type: options.errorType ?? 'error', text: errorMessage },
			{ status: (options.status ?? 400) as MessageOptions['status'] }
		);
	}
}
