<script lang="ts" generics="TData extends RowData, TValue">
	import { features, FlexRender, type Features } from '$lib/components/ui/data-table';
	import { Input } from '$lib/components/ui/input';
	import { NativeSelect } from '$lib/components/ui/native-select';
	import * as Table from '$lib/components/ui/table';
	import {
		createTable,
		type ColumnDef,
		type ColumnVisibilityState,
		type PaginationState,
		type RowData,
		type SortingState
	} from '@tanstack/svelte-table';

	let {
		columns,
		data,
		searchPlaceholder,
		defaultPageSize = 10,
		defaultSorting = [],
		emptyMessage = 'No results found.'
	}: {
		columns: ColumnDef<Features, TData, TValue>[];
		data: TData[];
		searchPlaceholder?: string;
		defaultPageSize?: number;
		defaultSorting?: SortingState;
		emptyMessage?: string;
	} = $props();

	// svelte-ignore state_referenced_locally
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize });
	// svelte-ignore state_referenced_locally
	let sorting = $state<SortingState>(defaultSorting);
	let globalFilter = $state<string>('');
	let columnVisibility = $state<ColumnVisibilityState>({});

	const table = createTable({
		features,
		get data() {
			return data;
		},
		get columns() {
			return columns as ColumnDef<Features, TData>[];
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onGlobalFilterChange: (updater) => {
			globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get globalFilter() {
				return globalFilter;
			},
			get columnVisibility() {
				return columnVisibility;
			}
		},
		globalFilterFn: 'includesString'
	});
</script>

<div class="space-y-4">
	{#if searchPlaceholder}
		<Input
			type="search"
			class="max-w-sm"
			placeholder={searchPlaceholder}
			value={globalFilter}
			oninput={(e) => table.setGlobalFilter(e.currentTarget.value)}
		/>
	{/if}

	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan}>
							{#if !header.isPlaceholder}
								<FlexRender {header} />
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender {cell} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="marker ink-faint py-6">
						{emptyMessage}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	<div class="flex flex-wrap items-center justify-between gap-3 py-2">
		<label class="ink-soft flex items-center gap-2 text-sm font-semibold">
			Rows per page
			<NativeSelect
				class="w-20"
				value={`${pagination.pageSize}`}
				onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
			>
				{#each [10, 20, 30, 40, 50] as size (size)}
					<option value={`${size}`}>{size}</option>
				{/each}
			</NativeSelect>
		</label>

		<div class="ink-soft tabular text-sm font-semibold">
			Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="pager"
				aria-label="First page"
				onclick={() => table.setPageIndex(0)}
				disabled={!table.getCanPreviousPage()}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
				</svg>
			</button>
			<button
				type="button"
				class="pager"
				aria-label="Previous page"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m15 18-6-6 6-6" />
				</svg>
			</button>
			<button
				type="button"
				class="pager"
				aria-label="Next page"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m9 18 6-6-6-6" />
				</svg>
			</button>
			<button
				type="button"
				class="pager"
				aria-label="Last page"
				onclick={() => table.setPageIndex(table.getPageCount() - 1)}
				disabled={!table.getCanNextPage()}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.pager {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 999px;
		color: var(--ink-soft);
		box-shadow: inset 0 0 0 1.5px var(--rule);
	}
	.pager:not(:disabled):hover {
		color: var(--ink);
		box-shadow: inset 0 0 0 1.5px var(--ink);
	}
	.pager:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
