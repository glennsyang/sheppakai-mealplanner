<script lang="ts">
	import DataTable from '$lib/components/ui/data-table/DataTable.svelte';

	import type { AdminUser } from './types';
	import { makeColumns } from './users-columns';

	let {
		users,
		currentUserId,
		allowlistedIds
	}: { users: AdminUser[]; currentUserId: string; allowlistedIds: string[] } = $props();

	const columns = $derived(makeColumns(currentUserId, new Set(allowlistedIds)));
</script>

<DataTable
	{columns}
	data={users}
	searchPlaceholder="Search users..."
	defaultPageSize={10}
	defaultSorting={[{ id: 'name', desc: false }]}
	emptyMessage="No users found."
/>
