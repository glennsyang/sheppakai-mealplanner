<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { NativeSelect } from '$lib/components/ui/native-select';
	import { USER_ROLES } from '$lib/schemas/admin';

	import type { AdminUser } from './types';

	let {
		user,
		currentUserId,
		allowlisted
	}: { user: AdminUser; currentUserId: string; allowlisted: boolean } = $props();

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
	<span class="ink-faint marker text-sm">you</span>
{:else}
	<div class="flex flex-wrap items-center gap-2">
		<form method="POST" action="?/setRole" use:enhance={submit}>
			<input type="hidden" name="userId" value={user.id} />
			<NativeSelect
				name="role"
				class="w-24"
				size="sm"
				value={user.role ?? 'user'}
				disabled={busy}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
				aria-label="Change role for {user.email}"
			>
				{#each USER_ROLES as role (role)}
					<option value={role}>{role}</option>
				{/each}
			</NativeSelect>
		</form>

		{#if allowlisted && !user.emailVerified}
			<form method="POST" action="?/sendWelcomeEmail" use:enhance={submit}>
				<input type="hidden" name="userId" value={user.id} />
				<Button type="submit" variant="outline" size="sm" disabled={busy}>
					Send welcome email
				</Button>
			</form>
		{/if}

		<form method="POST" action={banned ? '?/unbanUser' : '?/banUser'} use:enhance={submit}>
			<input type="hidden" name="userId" value={user.id} />
			<Button type="submit" variant="outline" size="sm" disabled={busy}>
				{banned ? 'Unban' : 'Ban'}
			</Button>
		</form>

		{#if confirmingRemove}
			<form
				method="POST"
				action="?/removeUser"
				use:enhance={submit}
				class="flex items-center gap-1"
			>
				<input type="hidden" name="userId" value={user.id} />
				<Button type="submit" variant="destructive" size="sm" disabled={busy}>Confirm</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy}
					onclick={() => (confirmingRemove = false)}
				>
					Cancel
				</Button>
			</form>
		{:else}
			<Button
				type="button"
				variant="tonal-destructive"
				size="sm"
				disabled={busy}
				onclick={() => (confirmingRemove = true)}
			>
				Remove
			</Button>
		{/if}
	</div>
{/if}
