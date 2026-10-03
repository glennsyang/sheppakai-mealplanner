<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type NativeSelectProps = Omit<WithElementRef<HTMLSelectAttributes>, 'size'> & {
		size?: 'sm' | 'default';
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = 'default',
		children,
		...restProps
	}: NativeSelectProps = $props();
</script>

<div
	class={cn('group/native-select relative w-fit', className)}
	data-slot="native-select-wrapper"
	data-size={size}
>
	<select
		bind:value
		bind:this={ref}
		data-slot="native-select"
		data-size={size}
		class="ring-input focus:ring-primary aria-invalid:ring-destructive block w-full min-w-0 appearance-none rounded-md border-0 bg-(--color-surface-50-950) py-[calc((var(--text-base)-0.125rem)/2)] pr-8 pl-[calc((var(--text-base)-0.125rem)/2+0.25rem)] text-base leading-(--text-base) text-(--ink) ring-[1.5px] outline-none ring-inset disabled:bg-[color-mix(in_oklch,var(--ink)_4%,transparent)] disabled:text-(--ink-soft) disabled:opacity-100 data-[size=sm]:py-[calc((var(--text-sm)-0.125rem)/2)] data-[size=sm]:text-sm data-[size=sm]:leading-(--text-sm) [&_option]:bg-(--color-surface-50-950) [&_option]:text-(--ink)"
		{...restProps}
	>
		{@render children?.()}
	</select>
	<span
		class="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
		data-slot="native-select-icon"
	>
		<Icon name="down" size={16} />
	</span>
</div>
