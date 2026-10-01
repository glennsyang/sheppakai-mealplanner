import type { ActionResult } from '@sveltejs/kit';

/**
 * The user-facing text from a failed planner/pantry action. Those actions all fail with
 * `{ form }` carrying a superforms `message` (see server/actions/domain-action.ts);
 * anything else — a thrown error, a 401 `{ error }` — falls back to `fallback`.
 */
export function actionFailureText(result: ActionResult, fallback: string): string {
	if (result.type === 'failure') {
		const form = result.data?.form as { message?: App.Superforms.Message } | undefined;
		if (form?.message?.text) return form.message.text;
	}
	return fallback;
}
