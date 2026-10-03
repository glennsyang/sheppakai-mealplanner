<script lang="ts">
	import { Alert } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
				<Button type="button" variant="outline" onclick={() => (isEditingName = true)}>Edit</Button>
			{/if}
		</div>

		{#if $nameMessage}
			<Alert
				variant={$nameMessage.type === 'success' ? 'success' : 'destructive'}
				role={$nameMessage.type === 'success' ? 'status' : 'alert'}
			>
				{$nameMessage.text}
			</Alert>
		{/if}

		<form method="POST" action="?/updateName" use:nameEnhance class="space-y-4">
			<Label>
				<span class="font-semibold">Name</span>
				<Input
					type="text"
					name="name"
					bind:value={$nameForm.name}
					class="mt-1"
					aria-invalid={$nameErrors.name ? 'true' : undefined}
					disabled={!isEditingName}
					minlength={$nameConstraints.name?.minlength}
					maxlength={$nameConstraints.name?.maxlength}
					required={$nameConstraints.name?.required}
					autocomplete="name"
				/>
				{#if $nameErrors.name}
					<span class="ink-red mt-1 block text-sm">{$nameErrors.name}</span>
				{/if}
			</Label>

			<Label>
				<span class="font-semibold">Email</span>
				<Input type="email" value={data.user.email} class="mt-1" disabled aria-readonly="true" />
				<span class="ink-soft mt-1 block text-sm">Email address cannot be changed.</span>
			</Label>

			{#if isEditingName}
				<div class="flex gap-2 pt-2">
					<Button type="submit" disabled={$nameSubmitting}>
						{$nameSubmitting ? 'Saving…' : 'Save changes'}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={$nameSubmitting}
						onclick={cancelNameEdit}
					>
						Cancel
					</Button>
				</div>
			{/if}
		</form>
	</section>

	<!-- Change Password -->
	<section class="profile-section space-y-5 py-8">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold tracking-tight">Change password</h2>
			{#if !isEditingPassword}
				<Button type="button" variant="outline" onclick={() => (isEditingPassword = true)}>
					Change password
				</Button>
			{/if}
		</div>

		{#if $passwordMessage}
			<Alert
				variant={$passwordMessage.type === 'success' ? 'success' : 'destructive'}
				role={$passwordMessage.type === 'success' ? 'status' : 'alert'}
			>
				{$passwordMessage.text}
			</Alert>
		{/if}

		{#if isEditingPassword}
			<form method="POST" action="?/changePassword" use:passwordEnhance class="space-y-4">
				<Label>
					<span class="font-semibold">Current password</span>
					<Input
						type="password"
						name="currentPassword"
						bind:value={$passwordForm.currentPassword}
						class="mt-1"
						aria-invalid={$passwordErrors.currentPassword ? 'true' : undefined}
						required
						autocomplete="current-password"
					/>
					{#if $passwordErrors.currentPassword}
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.currentPassword}</span>
					{/if}
				</Label>

				<Label>
					<span class="font-semibold">New password</span>
					<Input
						type="password"
						name="newPassword"
						bind:value={$passwordForm.newPassword}
						class="mt-1"
						aria-invalid={$passwordErrors.newPassword ? 'true' : undefined}
						placeholder="12+ characters"
						required
						autocomplete="new-password"
					/>
					{#if $passwordErrors.newPassword}
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.newPassword}</span>
					{/if}
				</Label>

				<Label>
					<span class="font-semibold">Confirm new password</span>
					<Input
						type="password"
						name="confirmPassword"
						bind:value={$passwordForm.confirmPassword}
						class="mt-1"
						aria-invalid={$passwordErrors.confirmPassword ? 'true' : undefined}
						required
						autocomplete="new-password"
					/>
					{#if $passwordErrors.confirmPassword}
						<span class="ink-red mt-1 block text-sm">{$passwordErrors.confirmPassword}</span>
					{/if}
				</Label>

				<div class="flex gap-2 pt-2">
					<Button type="submit" disabled={$passwordSubmitting}>
						{$passwordSubmitting ? 'Changing…' : 'Change password'}
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={$passwordSubmitting}
						onclick={cancelPasswordEdit}
					>
						Cancel
					</Button>
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
