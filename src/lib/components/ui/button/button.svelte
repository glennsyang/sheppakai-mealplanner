<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	// Magnet buttons: the variant classes are the world classes in app.css (.act, .act-quiet,
	// .act-text) so buttons keep the fridge-board look; sizes mirror the field scale.
	export const buttonVariants = tv({
		base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md no-underline transition [&>svg]:pointer-events-none [&>svg]:shrink-0',
		variants: {
			variant: {
				default: 'act',
				secondary: 'act act-green',
				destructive: 'act act-red',
				outline: 'act-quiet',
				tonal: 'bg-tonal-surface text-tonal-surface-foreground font-semibold',
				'tonal-destructive': 'bg-tonal-error text-tonal-error-foreground font-semibold',
				ghost: 'hover:bg-accent',
				link: 'act-text'
			},
			size: {
				default:
					'text-base leading-(--text-base) [&>svg]:size-(--text-base) py-[calc((var(--text-base)-0.125rem)/2)] px-[calc((var(--text-base)-0.125rem)/2+0.25rem)]',
				sm: 'text-sm leading-(--text-sm) [&>svg]:size-(--text-sm) py-[calc((var(--text-sm)-0.125rem)/2)] px-[calc((var(--text-sm)-0.125rem)/2+0.25rem)]',
				icon: 'size-9 rounded-full',
				none: ''
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
