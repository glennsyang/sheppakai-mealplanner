<script lang="ts">
	import { enhance } from '$app/forms';
	import { USER_ROLES } from '$lib/schemas/admin';

	import type { AdminUser } from './types';

	let { user, currentUserId }: { user: AdminUser; currentUserId: string } = $props();

	const isSelf = $derived(user.id === currentUserId);
	const banned = $derived(Boolean(user.banned));

	let confirmingRemove = $state(false);
	let busy = $state(false);

	const submit = () => {
		busy = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
			confirmingRemove = false;
		};
	};
</script>

{#if isSelf}
	<span class="text-surface-500 text-xs">Current user</span>
{:else}
	<div class="flex flex-wrap items-center gap-2">
		<form method="POST" action="?/setRole" use:enhance={submit}>
			<input type="hidden" name="userId" value={user.id} />
			<select
				name="role"
				class="select select-sm w-24"
				value={user.role ?? 'user'}
				disabled={busy}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
				aria-label="Change role for {user.email}"
			>
				{#each USER_ROLES as role (role)}
					<option value={role}>{role}</option>
				{/each}
			</select>
		</form>

		<form method="POST" action={banned ? '?/unbanUser' : '?/banUser'} use:enhance={submit}>
			<input type="hidden" name="userId" value={user.id} />
			<button type="submit" class="btn btn-sm preset-tonal-surface" disabled={busy}>
				{banned ? 'Unban' : 'Ban'}
			</button>
		</form>

		{#if confirmingRemove}
			<form
				method="POST"
				action="?/removeUser"
				use:enhance={submit}
				class="flex items-center gap-1"
			>
				<input type="hidden" name="userId" value={user.id} />
				<button type="submit" class="btn btn-sm preset-filled-error-500" disabled={busy}>
					Confirm
				</button>
				<button
					type="button"
					class="btn btn-sm preset-tonal-surface"
					disabled={busy}
					onclick={() => (confirmingRemove = false)}
				>
					Cancel
				</button>
			</form>
		{:else}
			<button
				type="button"
				class="btn btn-sm preset-tonal-error"
				disabled={busy}
				onclick={() => (confirmingRemove = true)}
			>
				Remove
			</button>
		{/if}
	</div>
{/if}
