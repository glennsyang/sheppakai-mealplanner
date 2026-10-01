<script lang="ts">
	import { createUserSchema, USER_ROLES, type CreateUserSchema } from '$lib/schemas/admin';
	import { fly } from 'svelte/transition';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';

	interface Props {
		data: SuperValidated<z.infer<CreateUserSchema>>;
		allowlist: string[];
	}

	let { data, allowlist }: Props = $props();

	let open = $state(false);
	// Email of the last user created while not on the allowlist — drives the
	// `fly secrets set` hint. Captured in onUpdate because the form resets after.
	let pendingAllowlistEmail = $state<string | null>(null);
	let copied = $state(false);

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data, {
		validators: zod4Client(createUserSchema),
		resetForm: true,
		onUpdate: ({ form: result }) => {
			pendingAllowlistEmail =
				result.valid && !allowlist.includes(result.data.email) && result.message?.type !== 'error'
					? result.data.email
					: null;
			copied = false;
		}
	});

	const allowlistCommand = $derived(
		pendingAllowlistEmail
			? `fly secrets set ALLOWED_EMAILS="${[...allowlist, pendingAllowlistEmail].join(',')}" -a sheppakai-mealplanner`
			: null
	);

	const messageClass = $derived(
		$message?.type === 'error'
			? 'preset-tonal-error'
			: $message?.type === 'warning'
				? 'preset-tonal-warning'
				: 'preset-tonal-success'
	);

	async function copyCommand() {
		if (!allowlistCommand) return;
		await navigator.clipboard.writeText(allowlistCommand);
		copied = true;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-4">
		<h2 class="text-xl font-bold tracking-tight">Users</h2>
		<button
			type="button"
			class="btn btn-sm {open ? 'preset-tonal-surface' : 'act'}"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-controls="create-user-form"
		>
			{open ? 'Close' : 'Add user'}
		</button>
	</div>

	{#if $message}
		<div
			class="alert space-y-2 text-sm {messageClass}"
			role="status"
			in:fly={{ y: 8, duration: 200 }}
		>
			<p>{$message.text}</p>
			{#if allowlistCommand}
				<div class="flex flex-wrap items-center gap-2">
					<code class="bg-surface-50-950 rounded px-2 py-1 text-xs break-all"
						>{allowlistCommand}</code
					>
					<button type="button" class="btn btn-sm act-quiet" onclick={copyCommand}>
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if open}
		<form
			id="create-user-form"
			method="POST"
			action="?/createUser"
			use:enhance
			class="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
			in:fly={{ y: -8, duration: 200 }}
		>
			<label class="label">
				<span class="label-text">Name</span>
				<input
					class="input"
					name="name"
					autocomplete="off"
					bind:value={$form.name}
					aria-invalid={$errors.name ? 'true' : undefined}
					{...$constraints.name}
				/>
				{#if $errors.name}<span class="text-error-500 text-xs">{$errors.name}</span>{/if}
			</label>

			<label class="label">
				<span class="label-text">Email</span>
				<!-- Individual attrs, not {...$constraints.email}: Zod v4's email pattern breaks the browser's `pattern` check. -->
				<input
					class="input"
					type="email"
					name="email"
					autocomplete="off"
					bind:value={$form.email}
					required={$constraints.email?.required}
					maxlength={$constraints.email?.maxlength}
					aria-invalid={$errors.email ? 'true' : undefined}
				/>
				{#if $errors.email}<span class="text-error-500 text-xs">{$errors.email}</span>{/if}
			</label>

			<label class="label">
				<span class="label-text">Role</span>
				<select class="select" name="role" bind:value={$form.role}>
					{#each USER_ROLES as role (role)}
						<option value={role}>{role}</option>
					{/each}
				</select>
			</label>

			<button type="submit" class="btn act" disabled={$submitting}>
				{$submitting ? 'Creating…' : 'Create user'}
			</button>

			<p class="ink-soft text-sm sm:col-span-4">
				No password is set here — the new user chooses their own via "Forgot password", as explained
				in the welcome email.
			</p>
		</form>
	{/if}
</div>
