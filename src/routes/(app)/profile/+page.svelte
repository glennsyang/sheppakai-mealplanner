<script lang="ts">
	import { changePasswordSchema, updateNameSchema } from '$lib/schemas/auth';
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
	<title>Profile — Meal Planner</title>
</svelte:head>

<div class="max-w-3xl px-5 pt-8 pb-12 sm:px-10 sm:pt-12">
	<div class="mb-8">
		<h1 class="text-[2rem] leading-tight font-bold tracking-tight sm:text-[2.5rem]">Profile</h1>
		<p class="ink-soft mt-2 text-lg">Your name, email and password.</p>
	</div>

	<!-- Profile Information -->
	<section class="profile-section space-y-5 py-8">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold tracking-tight">Profile information</h2>
			{#if !isEditingName}
				<button type="button" class="btn act-quiet" onclick={() => (isEditingName = true)}>
					Edit
				</button>
			{/if}
		</div>

		{#if $nameMessage}
			<div
				class="alert {$nameMessage.type === 'success'
					? 'preset-tonal-success'
					: 'preset-tonal-error'}"
			>
				{$nameMessage.text}
			</div>
		{/if}

		<form method="POST" action="?/updateName" use:nameEnhance class="space-y-4">
			<label class="label">
				<span class="font-semibold">Name</span>
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
					<span class="ink-red mt-1 block text-sm">{$nameErrors.name}</span>
				{/if}
			</label>

			<label class="label">
				<span class="font-semibold">Email</span>
				<input
					type="email"
					value={data.user.email}
					class="input mt-1"
					disabled
					aria-readonly="true"
				/>
				<span class="ink-soft mt-1 block text-sm">Email address cannot be changed.</span>
			</label>

			{#if isEditingName}
				<div class="flex gap-2 pt-2">
					<button type="submit" disabled={$nameSubmitting} class="btn act">
						{$nameSubmitting ? 'Saving…' : 'Save changes'}
					</button>
					<button
						type="button"
						class="btn act-quiet"
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
	<section class="profile-section space-y-5 py-8">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold tracking-tight">Change password</h2>
			{#if !isEditingPassword}
				<button type="button" class="btn act-quiet" onclick={() => (isEditingPassword = true)}>
					Change password
				</button>
			{/if}
		</div>

		{#if $passwordMessage}
			<div
				class="alert {$passwordMessage.type === 'success'
					? 'preset-tonal-success'
					: 'preset-tonal-error'}"
			>
				{$passwordMessage.text}
			</div>
		{/if}

		{#if isEditingPassword}
			<form method="POST" action="?/changePassword" use:passwordEnhance class="space-y-4">
				<label class="label">
					<span class="font-semibold">Current password</span>
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
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.currentPassword}</span>
					{/if}
				</label>

				<label class="label">
					<span class="font-semibold">New password</span>
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
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.newPassword}</span>
					{/if}
				</label>

				<label class="label">
					<span class="font-semibold">Confirm new password</span>
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
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.confirmPassword}</span>
					{/if}
				</label>

				<div class="flex gap-2 pt-2">
					<button type="submit" disabled={$passwordSubmitting} class="btn act">
						{$passwordSubmitting ? 'Changing…' : 'Change password'}
					</button>
					<button
						type="button"
						class="btn act-quiet"
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

<style>
	.profile-section {
		border-top: 1px solid var(--rule-strong);
	}
</style>
