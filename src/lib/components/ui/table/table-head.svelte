<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLThAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		'text-muted-foreground border-b-[1.5px] border-(--marker-red) px-3 py-[0.6rem] text-left text-[0.875rem] font-bold whitespace-nowrap',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
