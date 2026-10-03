<script lang="ts">
	import { FORGOT_PASSWORD_ROUTE, SIGN_IN_ROUTE } from '$lib/auth-routes';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
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
			<Button href={FORGOT_PASSWORD_ROUTE} class="w-full py-3 text-lg">Request a new link</Button>
			<Button href={SIGN_IN_ROUTE} variant="outline" class="w-full py-3">Back to sign in</Button>
		</div>
	{:else}
		<div>
			<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Set a new password</h1>
			<p class="ink-soft mt-1.5 text-lg">Pick something you haven't used before.</p>
		</div>

		<AuthFormMessage message={$message} />

		<form method="POST" use:enhance class="space-y-5">
			<input type="hidden" name="token" bind:value={data.token} />

			<Label>
				<span class="font-semibold">New password</span>
				<Input
					type="password"
					name="password"
					bind:value={$form.password}
					class="mt-1 text-lg"
					aria-invalid={$errors.password ? 'true' : undefined}
					minlength={$constraints.password?.minlength}
					required={$constraints.password?.required}
					placeholder="12+ characters, incl. upper/lower/number/symbol"
					autocomplete="new-password"
				/>
				{#if $errors.password}
					<span class="ink-red mt-1 block text-sm">{$errors.password}</span>
				{/if}
			</Label>

			<Label>
				<span class="font-semibold">Confirm new password</span>
				<Input
					type="password"
					name="confirmPassword"
					bind:value={$form.confirmPassword}
					class="mt-1 text-lg"
					aria-invalid={$errors.confirmPassword ? 'true' : undefined}
					required={$constraints.confirmPassword?.required}
					placeholder="Repeat your new password"
					autocomplete="new-password"
				/>
				{#if $errors.confirmPassword}
					<span class="ink-red mt-1 block text-sm">{$errors.confirmPassword}</span>
				{/if}
			</Label>

			<Button type="submit" disabled={$submitting} class="w-full py-3 text-lg">
				{$submitting ? 'Updating password…' : 'Update password'}
			</Button>
		</form>

		<p><a href={SIGN_IN_ROUTE} class="act-text ink-blue">Back to sign in</a></p>
	{/if}
</AuthShell>
