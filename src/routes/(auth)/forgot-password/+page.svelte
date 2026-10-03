<script lang="ts">
	import { SIGN_IN_ROUTE } from '$lib/auth-routes';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { forgotPasswordSchema } from '$lib/schemas/auth';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
		validators: zod4Client(forgotPasswordSchema)
	});
</script>

<svelte:head>
	<title>Forgot Password — Meal Planner</title>
</svelte:head>

<AuthShell>
	<div>
		<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Forgot your password?</h1>
		<p class="ink-soft mt-1.5 text-lg">We'll email you a link to reset it.</p>
	</div>

	<AuthFormMessage message={$message} />

	<form method="POST" use:enhance class="space-y-5">
		<Label>
			<span class="font-semibold">Email</span>
			<Input
				type="email"
				name="email"
				bind:value={$form.email}
				class="mt-1 text-lg"
				aria-invalid={$errors.email ? 'true' : undefined}
				required={$constraints.email?.required}
				placeholder="you@example.com"
				autocomplete="email"
			/>
			{#if $errors.email}
				<span class="ink-red mt-1 block text-sm">{$errors.email}</span>
			{/if}
		</Label>

		<Button type="submit" disabled={$submitting} class="w-full py-3 text-lg">
			{$submitting ? 'Sending reset link…' : 'Send reset link'}
		</Button>
	</form>

	<p class="ink-soft">
		Remembered it? <a href={SIGN_IN_ROUTE} class="act-text ink-blue">Back to sign in</a>
	</p>
</AuthShell>
