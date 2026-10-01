<script lang="ts">
	import { SIGN_IN_ROUTE } from '$lib/auth-routes';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { resendVerificationSchema } from '$lib/schemas/auth';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, enhance, message, submitting } = superForm(data.verificationForm, {
		validators: zod4Client(resendVerificationSchema)
	});
</script>

<svelte:head>
	<title>Verify Your Email — Meal Planner</title>
</svelte:head>

<AuthShell>
	<div>
		<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Check your email</h1>
		<p class="ink-soft mt-2 text-lg">Look for a verification link at</p>
		<p class="marker ink-blue mt-1 text-lg break-all">{data.email}</p>
	</div>

	<AuthFormMessage message={$message} />

	<ol class="ruled">
		<li class="flex gap-4 py-3">
			<span class="marker ink-red text-xl leading-none">1</span>
			<span>Open the most recent verification email.</span>
		</li>
		<li class="flex gap-4 py-3">
			<span class="marker ink-red text-xl leading-none">2</span>
			<span>Click the verification link in the email.</span>
		</li>
		<li class="flex gap-4 py-3">
			<span class="marker ink-red text-xl leading-none">3</span>
			<span>You'll be signed in and taken straight to tonight's dinner.</span>
		</li>
	</ol>

	<p class="ink-soft text-sm leading-relaxed">
		Not there? Check your spam or junk folder. The link expires in 10 minutes.
	</p>

	<div class="space-y-3">
		<form method="POST" action="?/resend" use:enhance class="space-y-2">
			<input type="hidden" name="email" bind:value={$form.email} />
			<button type="submit" disabled={$submitting} class="btn act w-full py-3">
				{$submitting ? 'Sending verification email…' : 'Resend verification email'}
			</button>
			{#if $errors.email}
				<p class="ink-red text-sm">{$errors.email}</p>
			{/if}
		</form>
		<a href={SIGN_IN_ROUTE} class="btn act-quiet w-full py-3">Back to sign in</a>
	</div>
</AuthShell>
