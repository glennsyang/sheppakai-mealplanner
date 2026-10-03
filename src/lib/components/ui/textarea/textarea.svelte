<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		'data-slot': dataSlot = 'textarea',
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'ring-input focus:ring-primary aria-invalid:ring-destructive block w-full rounded-lg border-0 bg-(--color-surface-50-950) px-[calc((var(--text-base)-0.125rem)/2+0.25rem)] py-[calc((var(--text-base)-0.125rem)/2)] text-base leading-(--text-base) text-(--ink) ring-[1.5px] outline-none ring-inset disabled:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] disabled:text-(--ink-soft) disabled:opacity-100',
		className
	)}
	bind:value
	{...restProps}></textarea>
