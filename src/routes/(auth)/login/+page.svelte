<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas/auth';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
		validators: zod4Client(loginSchema)
	});
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="card preset-outlined-surface-500 w-full max-w-md p-8 space-y-6"
		in:fly={{ y: 20, duration: 300 }}
	>
		<div class="text-center">
			<h1 class="h2 font-bold">Welcome back</h1>
			<p class="text-surface-500 mt-1">Sign in to your meal planner</p>
		</div>

		{#if $message}
			<div class="alert preset-tonal-error text-sm">{$message}</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
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
					required={$constraints.password?.required}
					placeholder="••••••••"
				/>
				{#if $errors.password}
					<span class="text-error-500 text-xs">{$errors.password}</span>
				{/if}
			</label>

			<button
				type="submit"
				disabled={$submitting}
				class="btn preset-filled-primary-500 w-full"
			>
				{$submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>

		<p class="text-center text-sm text-surface-500">
			Don't have an account?
			<a href="/register" class="text-primary-500 hover:underline font-medium">Create one</a>
		</p>
	</div>
</div>
