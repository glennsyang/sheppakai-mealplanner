<script lang="ts">
	import { enhance } from '$app/forms';
	import { POST_LOGIN_ROUTE } from '$lib/auth-routes';
	import AuthShell from '$lib/components/AuthShell.svelte';
</script>

<svelte:head>
	<title>Sign Out — Meal Planner</title>
</svelte:head>

<AuthShell>
	<div>
		<h1 class="text-[2rem] leading-tight font-bold tracking-tight">Sign out?</h1>
		<p class="ink-soft mt-1.5 text-lg">The week stays on the board for next time.</p>
	</div>

	<form method="POST" use:enhance>
		<button type="submit" class="btn act w-full py-3 text-lg">Sign out</button>
	</form>

	<p><a href={POST_LOGIN_ROUTE} class="act-text ink-blue">Cancel</a></p>
</AuthShell>
