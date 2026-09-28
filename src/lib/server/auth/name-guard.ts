import { APIError } from 'better-auth/api';

import { MAX_NAME_LENGTH } from '../../schemas/auth';

/**
 * `databaseHooks.user.{create,update}.before` guard. The profile form already caps the
 * name via `updateNameSchema`, but `/api/auth/update-user` and admin `createUser` write
 * straight through better-auth — this bounds the display name on every path (#126).
 */
export async function assertNameLength(data: { name?: string | null }): Promise<void> {
	if (typeof data.name === 'string' && data.name.length > MAX_NAME_LENGTH) {
		throw new APIError('BAD_REQUEST', {
			message: `Name must be at most ${MAX_NAME_LENGTH} characters`
		});
	}
}
