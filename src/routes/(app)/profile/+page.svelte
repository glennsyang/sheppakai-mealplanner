<script lang="ts">
	import { changePasswordSchema, updateNameSchema } from '$lib/schemas/auth';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isEditingName = $state(false);
	let isEditingPassword = $state(false);

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const nameFormStore = superForm(data.nameForm, {
		validators: zod4Client(updateNameSchema),
		onUpdate: ({ form }) => {
			if (form.message?.type === 'success') isEditingName = false;
		}
	});
	const {
		form: nameForm,
		errors: nameErrors,
		constraints: nameConstraints,
		message: nameMessage,
		submitting: nameSubmitting,
		enhance: nameEnhance
	} = nameFormStore;

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const passwordFormStore = superForm(data.passwordForm, {
		validators: zod4Client(changePasswordSchema),
		resetForm: true,
		onUpdate: ({ form }) => {
			if (form.message?.type === 'success') isEditingPassword = false;
		}
	});
	const {
		form: passwordForm,
		errors: passwordErrors,
		message: passwordMessage,
		submitting: passwordSubmitting,
		enhance: passwordEnhance
	} = passwordFormStore;

	function cancelNameEdit() {
		$nameForm.name = data.user.name;
		isEditingName = false;
	}

	function cancelPasswordEdit() {
		$passwordForm.currentPassword = '';
		$passwordForm.newPassword = '';
		$passwordForm.confirmPassword = '';
		isEditingPassword = false;
	}
</script>

<svelte:head>
	<title>Profile — MealPlanner</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-8 px-6 py-10">
	<div in:fly={{ y: 20, duration: 400, easing: expoOut }}>
		<h1 class="h2 font-bold">Profile</h1>
		<p class="text-surface-500 mt-1">Manage your account information and security settings.</p>
	</div>

	<!-- Profile Information -->
	<section
		class="card preset-outlined-surface-300-700 space-y-4 p-4 sm:p-6"
		in:fly={{ y: 20, delay: 80, duration: 400, easing: expoOut }}
	>
		<div class="flex items-center justify-between">
			<h2 class="h4 font-semibold">Profile information</h2>
			{#if !isEditingName}
				<button
					type="button"
					class="btn btn-sm preset-outlined-surface-500"
					onclick={() => (isEditingName = true)}
				>
					Edit
				</button>
			{/if}
		</div>

		{#if $nameMessage}
			<div
				class="alert text-sm {$nameMessage.type === 'success'
					? 'preset-tonal-success'
					: 'preset-tonal-error'}"
			>
				{$nameMessage.text}
			</div>
		{/if}

		<form method="POST" action="?/updateName" use:nameEnhance class="space-y-4">
			<label class="label">
				<span class="label-text text-sm font-medium">Name</span>
				<input
					type="text"
					name="name"
					bind:value={$nameForm.name}
					class="input mt-1"
					class:input-error={$nameErrors.name}
					disabled={!isEditingName}
					minlength={$nameConstraints.name?.minlength}
					maxlength={$nameConstraints.name?.maxlength}
					required={$nameConstraints.name?.required}
					autocomplete="name"
				/>
				{#if $nameErrors.name}
					<span class="text-error-500 mt-1 block text-xs">{$nameErrors.name}</span>
				{/if}
			</label>

			<label class="label">
				<span class="label-text text-sm font-medium">Email</span>
				<input
					type="email"
					value={data.user.email}
					class="input mt-1"
					disabled
					aria-readonly="true"
				/>
				<span class="text-surface-500 mt-1 block text-xs">Email address cannot be changed.</span>
			</label>

			{#if isEditingName}
				<div class="flex gap-2 pt-2">
					<button
						type="submit"
						disabled={$nameSubmitting}
						class="btn btn-sm preset-filled-primary-500"
					>
						{$nameSubmitting ? 'Saving…' : 'Save changes'}
					</button>
					<button
						type="button"
						class="btn btn-sm preset-outlined-surface-500"
						disabled={$nameSubmitting}
						onclick={cancelNameEdit}
					>
						Cancel
					</button>
				</div>
			{/if}
		</form>
	</section>

	<!-- Change Password -->
	<section
		class="card preset-outlined-surface-300-700 space-y-4 p-4 sm:p-6"
		in:fly={{ y: 20, delay: 140, duration: 400, easing: expoOut }}
	>
		<div class="flex items-center justify-between">
			<h2 class="h4 font-semibold">Change password</h2>
			{#if !isEditingPassword}
				<button
					type="button"
					class="btn btn-sm preset-outlined-surface-500"
					onclick={() => (isEditingPassword = true)}
				>
					Change password
				</button>
			{/if}
		</div>

		{#if $passwordMessage}
			<div
				class="alert text-sm {$passwordMessage.type === 'success'
					? 'preset-tonal-success'
					: 'preset-tonal-error'}"
			>
				{$passwordMessage.text}
			</div>
		{/if}

		{#if isEditingPassword}
			<form method="POST" action="?/changePassword" use:passwordEnhance class="space-y-4">
				<label class="label">
					<span class="label-text text-sm font-medium">Current password</span>
					<input
						type="password"
						name="currentPassword"
						bind:value={$passwordForm.currentPassword}
						class="input mt-1"
						class:input-error={$passwordErrors.currentPassword}
						required
						autocomplete="current-password"
					/>
					{#if $passwordErrors.currentPassword}
						<span class="text-error-500 mt-1 block text-xs">{$passwordErrors.currentPassword}</span>
					{/if}
				</label>

				<label class="label">
					<span class="label-text text-sm font-medium">New password</span>
					<input
						type="password"
						name="newPassword"
						bind:value={$passwordForm.newPassword}
						class="input mt-1"
						class:input-error={$passwordErrors.newPassword}
						placeholder="12+ characters"
						required
						autocomplete="new-password"
					/>
					{#if $passwordErrors.newPassword}
						<span class="text-error-500 mt-1 block text-xs">{$passwordErrors.newPassword}</span>
					{/if}
				</label>

				<label class="label">
					<span class="label-text text-sm font-medium">Confirm new password</span>
					<input
						type="password"
						name="confirmPassword"
						bind:value={$passwordForm.confirmPassword}
						class="input mt-1"
						class:input-error={$passwordErrors.confirmPassword}
						required
						autocomplete="new-password"
					/>
					{#if $passwordErrors.confirmPassword}
						<span class="text-error-500 mt-1 block text-xs">{$passwordErrors.confirmPassword}</span>
					{/if}
				</label>

				<div class="flex gap-2 pt-2">
					<button
						type="submit"
						disabled={$passwordSubmitting}
						class="btn btn-sm preset-filled-primary-500"
					>
						{$passwordSubmitting ? 'Changing…' : 'Change password'}
					</button>
					<button
						type="button"
						class="btn btn-sm preset-outlined-surface-500"
						disabled={$passwordSubmitting}
						onclick={cancelPasswordEdit}
					>
						Cancel
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>
