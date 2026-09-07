<script lang="ts" generics="TData extends RowData, TValue">
	import { features, FlexRender, type Features } from '$lib/components/ui/data-table';
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
		<input
			type="search"
			class="input max-w-sm"
			placeholder={searchPlaceholder}
			value={globalFilter}
			oninput={(e) => table.setGlobalFilter(e.currentTarget.value)}
		/>
	{/if}

	<div class="border-surface-200-800 overflow-x-auto rounded-xl border">
		<table class="table">
			<thead>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<tr>
						{#each headerGroup.headers as header (header.id)}
							<th colspan={header.colSpan} class="text-left">
								{#if !header.isPlaceholder}
									<FlexRender {header} />
								{/if}
							</th>
						{/each}
					</tr>
				{/each}
			</thead>
			<tbody>
				{#each table.getRowModel().rows as row (row.id)}
					<tr>
						{#each row.getVisibleCells() as cell (cell.id)}
							<td>
								<FlexRender {cell} />
							</td>
						{/each}
					</tr>
				{:else}
					<tr>
						<td colspan={columns.length} class="text-surface-500 py-6 text-center">
							{emptyMessage}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 py-2">
		<label class="text-surface-500 flex items-center gap-2 text-sm">
			Rows per page
			<select
				class="select w-20"
				value={`${pagination.pageSize}`}
				onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
			>
				{#each [10, 20, 30, 40, 50] as size (size)}
					<option value={`${size}`}>{size}</option>
				{/each}
			</select>
		</label>

		<div class="text-surface-500 text-sm font-medium">
			Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="btn-icon preset-outlined-surface-300-700"
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
				class="btn-icon preset-outlined-surface-300-700"
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
				class="btn-icon preset-outlined-surface-300-700"
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
				class="btn-icon preset-outlined-surface-300-700"
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
