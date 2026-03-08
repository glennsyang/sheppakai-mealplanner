<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { registerSchema } from '$lib/schemas/auth';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
		validators: zod4Client(registerSchema)
	});
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="card preset-outlined-surface-500 w-full max-w-md p-8 space-y-6"
		in:fly={{ y: 20, duration: 300 }}
	>
		<div class="text-center">
			<h1 class="h2 font-bold">Create account</h1>
			<p class="text-surface-500 mt-1">Start planning your weekly dinners</p>
		</div>

		{#if $message}
			<div class="alert preset-tonal-error text-sm">{$message}</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<label class="label">
				<span class="label-text">Name</span>
				<input
					type="text"
					name="name"
					bind:value={$form.name}
					class="input"
					class:input-error={$errors.name}
					minlength={$constraints.name?.minLength}
					maxlength={$constraints.name?.maxLength}
					required={$constraints.name?.required}
					placeholder="Your name"
				/>
				{#if $errors.name}
					<span class="text-error-500 text-xs">{$errors.name}</span>
				{/if}
			</label>

			<label class="label">
				<span class="label-text">Email</span>
				<input
					type="email"
					name="email"
					bind:value={$form.email}
					class="input"
					class:input-error={$errors.email}
					required={$constraints.email?.required}
					placeholder="you@example.com"
				/>
				{#if $errors.email}
					<span class="text-error-500 text-xs">{$errors.email}</span>
				{/if}
			</label>

			<label class="label">
				<span class="label-text">Password</span>
				<input
					type="password"
					name="password"
					bind:value={$form.password}
					class="input"
					class:input-error={$errors.password}
					minlength={$constraints.password?.minLength}
					required={$constraints.password?.required}
					placeholder="At least 8 characters"
				/>
				{#if $errors.password}
					<span class="text-error-500 text-xs">{$errors.password}</span>
				{/if}
			</label>

			<label class="label">
				<span class="label-text">Confirm password</span>
				<input
					type="password"
					name="confirmPassword"
					bind:value={$form.confirmPassword}
					class="input"
					class:input-error={$errors.confirmPassword}
					required={$constraints.confirmPassword?.required}
					placeholder="Repeat your password"
				/>
				{#if $errors.confirmPassword}
					<span class="text-error-500 text-xs">{$errors.confirmPassword}</span>
				{/if}
			</label>

			<button
				type="submit"
				disabled={$submitting}
				class="btn preset-filled-primary-500 w-full"
			>
				{$submitting ? 'Creating account…' : 'Create account'}
			</button>
		</form>

		<p class="text-center text-sm text-surface-500">
			Already have an account?
			<a href="/login" class="text-primary-500 hover:underline font-medium">Sign in</a>
		</p>
	</div>
</div>
