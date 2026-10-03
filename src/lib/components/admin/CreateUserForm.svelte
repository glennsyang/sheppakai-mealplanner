<script lang="ts">
	import { Alert, type AlertVariant } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { NativeSelect } from '$lib/components/ui/native-select';
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

	const messageVariant: AlertVariant = $derived(
		$message?.type === 'error'
			? 'destructive'
			: $message?.type === 'warning'
				? 'warning'
				: 'success'
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
		<Button
			type="button"
			size="sm"
			variant={open ? 'tonal' : 'default'}
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-controls="create-user-form"
		>
			{open ? 'Close' : 'Add user'}
		</Button>
	</div>

	{#if $message}
		<div in:fly={{ y: 8, duration: 200 }}>
			<Alert variant={messageVariant} class="space-y-2 text-sm" role="status">
				<p>{$message.text}</p>
				{#if allowlistCommand}
					<div class="flex flex-wrap items-center gap-2">
						<code class="bg-tonal-surface rounded px-2 py-1 text-xs break-all"
							>{allowlistCommand}</code
						>
						<Button type="button" variant="outline" size="sm" onclick={copyCommand}>
							{copied ? 'Copied' : 'Copy'}
						</Button>
					</div>
				{/if}
			</Alert>
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
			<Label>
				<span class="block text-xs font-medium">Name</span>
				<Input
					name="name"
					autocomplete="off"
					bind:value={$form.name}
					aria-invalid={$errors.name ? 'true' : undefined}
					{...$constraints.name}
				/>
				{#if $errors.name}<span class="ink-red text-xs">{$errors.name}</span>{/if}
			</Label>

			<Label>
				<span class="block text-xs font-medium">Email</span>
				<!-- Individual attrs, not {...$constraints.email}: Zod v4's email pattern breaks the browser's `pattern` check. -->
				<Input
					type="email"
					name="email"
					autocomplete="off"
					bind:value={$form.email}
					required={$constraints.email?.required}
					maxlength={$constraints.email?.maxlength}
					aria-invalid={$errors.email ? 'true' : undefined}
				/>
				{#if $errors.email}<span class="ink-red text-xs">{$errors.email}</span>{/if}
			</Label>

			<Label>
				<span class="block text-xs font-medium">Role</span>
				<NativeSelect name="role" bind:value={$form.role}>
					{#each USER_ROLES as role (role)}
						<option value={role}>{role}</option>
					{/each}
				</NativeSelect>
			</Label>

			<Button type="submit" disabled={$submitting}>
				{$submitting ? 'Creating…' : 'Create user'}
			</Button>

			<p class="ink-soft text-sm sm:col-span-4">
				No password is set here — the new user chooses their own via "Forgot password", as explained
				in the welcome email.
			</p>
		</form>
	{/if}
</div>
