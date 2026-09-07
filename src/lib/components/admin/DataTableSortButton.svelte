<script lang="ts">
	let {
		columnName,
		onclick
	}: {
		columnName: string;
		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<button
	type="button"
	class="hover:text-surface-950-50 inline-flex items-center gap-1.5 font-medium transition-colors"
	{onclick}
>
	{columnName}
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
	</svg>
</button>
