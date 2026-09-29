import type * as Sentry from '@sentry/sveltekit';

type DataCollection = NonNullable<NonNullable<Parameters<typeof Sentry.init>[0]>['dataCollection']>;

const piiHeaderDenylist = ['forwarded', '-ip', 'remote-', 'via', '-user'];

// Shared by hooks.client.ts and hooks.server.ts. An unset `dataCollection` collects everything
// (cookies, bodies, user info, IPs), so this pins the restrictive baseline explicitly: no user
// context or IPs, no cookies (keeps the auth session cookie out), no request/response bodies,
// and IP/forwarding headers stripped. requestId is the only prod correlation key.
export const sentryDataCollection: DataCollection = {
	userInfo: false,
	cookies: false,
	httpHeaders: {
		request: { deny: piiHeaderDenylist },
		response: { deny: piiHeaderDenylist }
	},
	httpBodies: [],
	urlQueryParams: { deny: piiHeaderDenylist },
	genAI: { inputs: false, outputs: false },
	databaseQueryData: false,
	graphQL: { document: false, variables: false }
};
