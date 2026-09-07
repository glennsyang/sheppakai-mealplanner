<script lang="ts">
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import type { AdminUser } from '$lib/components/admin/types';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { error?: string } | null } = $props();

	const users = $derived(data.users as AdminUser[]);
</script>

<svelte:head>
	<title>Admin — MealPlanner</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 px-6 py-10">
	<div in:fly={{ y: 20, duration: 400, easing: expoOut }}>
		<h1 class="h2 font-bold">Admin</h1>
		<p class="text-surface-500 mt-1">Manage user roles and access.</p>
	</div>

	{#if form?.error}
		<div class="alert preset-tonal-error" in:fly={{ y: 8, duration: 200 }}>
			{form.error}
		</div>
	{/if}

	<div
		class="card preset-outlined-surface-300-700 p-4 sm:p-6"
		in:fly={{ y: 20, delay: 80, duration: 400, easing: expoOut }}
	>
		<AdminUsersTable {users} currentUserId={data.user.id} />
	</div>
</div>
