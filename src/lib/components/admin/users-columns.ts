import { type Features, renderComponent } from '$lib/components/ui/data-table';
import type { ColumnDef } from '@tanstack/table-core';

import AdminUserActions from './AdminUserActions.svelte';
import DataTableSortButton from './DataTableSortButton.svelte';
import RoleBadge from './RoleBadge.svelte';
import StatusBadge from './StatusBadge.svelte';
import type { AdminUser } from './types';

export function makeColumns(currentUserId: string): ColumnDef<Features, AdminUser>[] {
	return [
		{
			accessorKey: 'email',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					columnName: 'Email',
					onclick: column.getToggleSortingHandler()
				})
		},
		{
			accessorKey: 'name',
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					columnName: 'Name',
					onclick: column.getToggleSortingHandler()
				})
		},
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => renderComponent(RoleBadge, { role: row.original.role ?? 'user' })
		},
		{
			accessorKey: 'status',
			header: 'Status',
			accessorFn: (row) => (row.banned ? 'Banned' : 'Active'),
			cell: ({ row }) => renderComponent(StatusBadge, { banned: Boolean(row.original.banned) })
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
		},
		{
			id: 'actions',
			header: 'Actions',
			enableSorting: false,
			cell: ({ row }) => renderComponent(AdminUserActions, { user: row.original, currentUserId })
		}
	];
}
