<script lang="ts">
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import CreateUserForm from '$lib/components/admin/CreateUserForm.svelte';
	import type { AdminUser } from '$lib/components/admin/types';
	import { Alert } from '$lib/components/ui/alert';

	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { error?: string; success?: string } | null } =
		$props();

	const users = $derived(data.users as AdminUser[]);
</script>

<svelte:head>
	<title>Admin — Meal Planner</title>
</svelte:head>

<div class="space-y-8 px-5 pt-8 pb-12 sm:px-10 sm:pt-12">
	<div>
		<h1 class="text-[2rem] leading-tight font-bold tracking-tight sm:text-[2.5rem]">Admin</h1>
		<p class="ink-soft mt-2 text-lg">Add users and manage their roles and access.</p>
	</div>

	{#if form?.error}
		<Alert variant="destructive" role="alert">
			{form.error}
		</Alert>
	{:else if form?.success}
		<Alert variant="success" role="status">
			{form.success}
		</Alert>
	{/if}

	<div class="space-y-10">
		<CreateUserForm data={data.createForm} allowlist={data.allowlist} />
		<AdminUsersTable {users} currentUserId={data.user.id} allowlistedIds={data.allowlistedIds} />
	</div>
</div>
