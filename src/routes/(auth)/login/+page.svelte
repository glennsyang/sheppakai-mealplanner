<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { loginSchema } from '$lib/schemas/auth';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
		validators: zod4Client(loginSchema)
	});
</script>

<svelte:head>
	<title>Sign In — MealPlanner</title>
</svelte:head>

<div class="flex min-h-dvh">
	<!-- Brand panel — hidden on mobile, visible lg+ -->
	<div class="hidden lg:flex lg:flex-col lg:w-5/12 auth-brand-panel p-12 justify-between text-white">
		<div>
			<span class="font-serif text-xl font-semibold tracking-tight">Meal</span><span class="font-serif text-xl font-semibold italic tracking-tight">&nbsp;Planner</span>
		</div>
		<div class="space-y-6">
			<blockquote class="font-serif text-4xl italic font-semibold leading-tight tracking-tight">
				"Plan your week<br />with intention."
			</blockquote>
			<p class="text-primary-100 text-sm leading-relaxed font-light max-w-xs">
				From pantry to plate — discover dinners from what you already have, then build your week around them.
			</p>
		</div>
		<p class="text-primary-200 text-xs">© 2026 Meal Planner</p>
	</div>

	<!-- Form panel -->
	<div class="flex flex-1 items-center justify-center p-8 bg-surface-50-950">
		<div
			class="w-full max-w-sm space-y-8"
			in:fly={{ y: 20, duration: 450, easing: expoOut }}
		>
			<!-- Mobile wordmark -->
			<div class="lg:hidden text-center mb-2">
				<span class="font-serif text-xl font-semibold">Meal</span><span class="font-serif text-xl font-semibold italic text-primary-600">&nbsp;Planner</span>
			</div>

			<div class="space-y-1">
				<h1 class="h2 font-semibold tracking-tight">Welcome back</h1>
				<p class="text-surface-500 text-sm font-light">Sign in to continue planning</p>
			</div>

			{#if $message}
				<div class="alert preset-tonal-error text-sm">{$message}</div>
			{/if}

			<form method="POST" use:enhance class="space-y-5">
				<label class="label">
					<span class="label-text text-sm font-medium">Email</span>
					<input
						type="email"
						name="email"
						bind:value={$form.email}
						class="input mt-1"
						class:input-error={$errors.email}
						required={$constraints.email?.required}
						placeholder="you@example.com"
						autocomplete="email"
					/>
					{#if $errors.email}
						<span class="text-error-500 text-xs mt-1 block">{$errors.email}</span>
					{/if}
				</label>

				<label class="label">
					<span class="label-text text-sm font-medium">Password</span>
					<input
						type="password"
						name="password"
						bind:value={$form.password}
						class="input mt-1"
						class:input-error={$errors.password}
						required={$constraints.password?.required}
						placeholder="••••••••••••"
						autocomplete="current-password"
					/>
					{#if $errors.password}
						<span class="text-error-500 text-xs mt-1 block">{$errors.password}</span>
					{/if}
				</label>

				<button
					type="submit"
					disabled={$submitting}
					class="btn preset-filled-primary-500 w-full mt-2"
				>
					{$submitting ? 'Signing in…' : 'Sign in'}
				</button>
			</form>

			<p class="text-center text-sm text-surface-500">
				No account yet?&ensp;<a href="/register" class="text-primary-600 font-medium hover:underline underline-offset-2">Create one</a>
			</p>
		</div>
	</div>
</div>
