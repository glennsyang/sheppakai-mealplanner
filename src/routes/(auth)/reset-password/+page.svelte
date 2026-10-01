<script lang="ts">
	import { FORGOT_PASSWORD_ROUTE, SIGN_IN_ROUTE } from '$lib/auth-routes';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { resetPasswordSchema } from '$lib/schemas/auth';
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
	<title>Reset Password — Meal Planner</title>
</svelte:head>

<AuthShell>
	{#if data.invalid}
		<div>
			<h1 class="text-[2rem] leading-tight font-bold tracking-tight">
				That link has <span class="marker ink-red">expired</span>
			</h1>
			<p class="ink-soft mt-2 text-lg leading-relaxed">
				This password reset link is no longer valid. Request a new one and we'll email it right
				over.
			</p>
		</div>
		<div class="space-y-3">
			<a href={FORGOT_PASSWORD_ROUTE} class="btn act w-full py-3 text-lg">Request a new link</a>
			<a href={SIGN_IN_ROUTE} class="btn act-quiet w-full py-3">Back to sign in</a>
		</div>
	{:else}
		<div>
			<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Set a new password</h1>
			<p class="ink-soft mt-1.5 text-lg">Pick something you haven't used before.</p>
		</div>

		<AuthFormMessage message={$message} />

		<form method="POST" use:enhance class="space-y-5">
			<input type="hidden" name="token" bind:value={data.token} />

			<label class="label">
				<span class="font-semibold">New password</span>
				<input
					type="password"
					name="password"
					bind:value={$form.password}
					class="input mt-1 text-lg"
					class:input-error={$errors.password}
					minlength={$constraints.password?.minlength}
					required={$constraints.password?.required}
					placeholder="12+ characters, incl. upper/lower/number/symbol"
					autocomplete="new-password"
				/>
				{#if $errors.password}
					<span class="ink-red mt-1 block text-sm">{$errors.password}</span>
				{/if}
			</label>

			<label class="label">
				<span class="font-semibold">Confirm new password</span>
				<input
					type="password"
					name="confirmPassword"
					bind:value={$form.confirmPassword}
					class="input mt-1 text-lg"
					class:input-error={$errors.confirmPassword}
					required={$constraints.confirmPassword?.required}
					placeholder="Repeat your new password"
					autocomplete="new-password"
				/>
				{#if $errors.confirmPassword}
					<span class="ink-red mt-1 block text-sm">{$errors.confirmPassword}</span>
				{/if}
			</label>

			<button type="submit" disabled={$submitting} class="btn act w-full py-3 text-lg">
				{$submitting ? 'Updating password…' : 'Update password'}
			</button>
		</form>

		<p><a href={SIGN_IN_ROUTE} class="act-text ink-blue">Back to sign in</a></p>
	{/if}
</AuthShell>
