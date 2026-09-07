// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			// Inferred from the configured better-auth instance so plugin fields (the `admin`
			// plugin's `role` / `banned` / …) are present on the type, not just at runtime.
			user: import('$lib/server/auth').SessionUser | null;
			session: import('$lib/server/auth').SessionData | null;
			requestId?: string;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
