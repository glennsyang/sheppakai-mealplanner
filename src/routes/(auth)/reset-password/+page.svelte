<script lang="ts">
	import { resetPasswordSchema } from '$lib/schemas/auth';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
		validators: zod4Client(resetPasswordSchema)
	});
</script>

<svelte:head>
	<title>Reset Password — MealPlanner</title>
</svelte:head>

<div class="flex min-h-dvh">
	<!-- Brand panel — hidden on mobile, visible lg+ -->
	<div
		class="auth-brand-panel hidden justify-between p-12 text-white lg:flex lg:w-5/12 lg:flex-col"
	>
		<div>
			<span class="font-serif text-xl font-semibold tracking-tight">Meal</span><span
				class="font-serif text-xl font-semibold tracking-tight italic">&nbsp;Planner</span
			>
		</div>
		<div class="space-y-6">
			<blockquote class="font-serif text-4xl leading-tight font-semibold tracking-tight italic">
				"New password,<br />fresh start."
			</blockquote>
			<p class="text-primary-100 max-w-xs text-sm leading-relaxed font-light">
				Choose a new password and you'll be signed back in to your weekly planner.
			</p>
		</div>
		<p class="text-primary-200 text-xs">© 2026 Meal Planner</p>
	</div>

	<!-- Form panel -->
	<div class="bg-surface-50-950 flex flex-1 items-center justify-center p-8">
		<div class="w-full max-w-sm space-y-8" in:fly={{ y: 20, duration: 450, easing: expoOut }}>
			<!-- Mobile wordmark -->
			<div class="mb-2 text-center lg:hidden">
				<span class="font-serif text-xl font-semibold">Meal</span><span
					class="text-primary-600 font-serif text-xl font-semibold italic">&nbsp;Planner</span
				>
			</div>

			{#if data.invalid}
				<div class="space-y-4 text-center">
					<div
						class="bg-error-500/10 mx-auto mb-2 flex size-16 items-center justify-center rounded-full"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-error-500"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="m15 9-6 6" />
							<path d="m9 9 6 6" />
						</svg>
					</div>
					<h1 class="h2 font-semibold tracking-tight">Invalid or expired link</h1>
					<p class="text-surface-500 text-sm">
						This password reset link is no longer valid. Request a new one and we'll email it right
						over.
					</p>
					<a href="/forgot-password" class="btn preset-filled-primary-500 w-full"
						>Request a new link</a
					>
					<a href="/login" class="btn preset-outlined-surface-500 w-full">Back to sign in</a>
				</div>
			{:else}
				<div class="space-y-1">
					<h1 class="h2 font-semibold tracking-tight">Set a new password</h1>
					<p class="text-surface-500 text-sm font-light">Pick something you haven't used before</p>
				</div>

				{#if $message}
					<div class="alert preset-tonal-error text-sm">{$message}</div>
				{/if}

				<form method="POST" use:enhance class="space-y-5">
					<input type="hidden" name="token" bind:value={data.token} />

					<label class="label">
						<span class="label-text text-sm font-medium">New password</span>
						<input
							type="password"
							name="password"
							bind:value={$form.password}
							class="input mt-1"
							class:input-error={$errors.password}
							minlength={$constraints.password?.minlength}
							required={$constraints.password?.required}
							placeholder="At least 12 characters"
							autocomplete="new-password"
						/>
						{#if $errors.password}
							<span class="text-error-500 mt-1 block text-xs">{$errors.password}</span>
						{/if}
					</label>

					<label class="label">
						<span class="label-text text-sm font-medium">Confirm new password</span>
						<input
							type="password"
							name="confirmPassword"
							bind:value={$form.confirmPassword}
							class="input mt-1"
							class:input-error={$errors.confirmPassword}
							required={$constraints.confirmPassword?.required}
							placeholder="Repeat your new password"
							autocomplete="new-password"
						/>
						{#if $errors.confirmPassword}
							<span class="text-error-500 mt-1 block text-xs">{$errors.confirmPassword}</span>
						{/if}
					</label>

					<button
						type="submit"
						disabled={$submitting}
						class="btn preset-filled-primary-500 mt-2 w-full"
					>
						{$submitting ? 'Updating password…' : 'Update password'}
					</button>
				</form>

				<p class="text-surface-500 text-center text-sm">
					<a href="/login" class="text-primary-600 font-medium underline-offset-2 hover:underline"
						>Back to sign in</a
					>
				</p>
			{/if}
		</div>
	</div>
</div>
