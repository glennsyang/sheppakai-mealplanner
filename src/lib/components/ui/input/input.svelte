<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	// Board-coloured field with a 1.5px ruled outline that inks blue on focus (DESIGN.md "Inputs")
	const fieldClass =
		'block w-full min-w-0 rounded-md border-0 bg-(--color-surface-50-950) text-(--ink) text-base leading-(--text-base) py-[calc((var(--text-base)-0.125rem)/2)] px-[calc((var(--text-base)-0.125rem)/2+0.25rem)] ring-[1.5px] ring-inset ring-input outline-none focus:ring-primary aria-invalid:ring-destructive disabled:opacity-100 disabled:text-(--ink-soft) disabled:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] file:mr-2 file:rounded-md file:border-0 file:bg-foreground file:px-2 file:text-xs file:text-background';

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(fieldClass, className)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(fieldClass, className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
