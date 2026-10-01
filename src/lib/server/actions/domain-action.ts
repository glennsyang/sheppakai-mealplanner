import { logger } from '$lib/server/logger';
import { isRedirect } from '@sveltejs/kit';
import { message } from 'sveltekit-superforms';
import type { SuperValidated } from 'sveltekit-superforms';

interface DomainActionOptions {
	/** Logged at `error` alongside the thrown value. */
	loggerContext: string;
	/** Shown to the user; never the raw error. */
	fallbackMessage: string;
	/** Extra structured fields for the log entry (e.g. `{ userId }`). */
	logFields?: Record<string, unknown>;
}

/**
 * The single error boundary for app (non-auth) form actions, mirroring
 * `handleAuthFormAction`. Runs `action`; on success returns `{ form }`. A SvelteKit
 * redirect is re-thrown untouched; anything else is logged and returned as
 * `message(form, { type: 'error', … }, { status: 500 })`, which superforms turns into
 * `fail(500, { form })` — so every planner/pantry action responds with the same
 * `{ form }` shape for validation errors, server errors and success alike.
 */
export async function handleDomainAction<TForm extends Record<string, unknown>>(
	form: SuperValidated<TForm>,
	action: () => Promise<unknown>,
	options: DomainActionOptions
) {
	try {
		await action();
		return { form };
	} catch (err) {
		if (isRedirect(err)) throw err;
		logger.error(options.loggerContext, err, options.logFields);
		return message(form, { type: 'error', text: options.fallbackMessage }, { status: 500 });
	}
}
