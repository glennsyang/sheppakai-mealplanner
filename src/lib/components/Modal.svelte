<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		ariaLabel: string;
		/** `dialog`: centered card. `drawer`: full-height panel sliding in from the right. */
		variant?: 'dialog' | 'drawer';
		children: Snippet;
	}

	let { open, onClose, ariaLabel, variant = 'dialog', children }: Props = $props();

	// bits-ui owns focus trapping, focus restore, scroll lock and Escape. Escape only closes
	// the topmost layer, so a recipe drawer opened from the variations panel doesn't take
	// the panel down with it. Callers render their own close button.
	function handleOpenChange(next: boolean) {
		if (!next) onClose();
	}

	// Focus the panel itself on open (not its first field), so screen readers announce the
	// dialog by its label and no focus ring lands on an input the user hasn't reached yet.
	let panel = $state<HTMLElement | null>(null);

	function focusPanel(e: Event) {
		e.preventDefault();
		panel?.focus();
	}
</script>

{#if variant === 'drawer'}
	<Sheet.Root {open} onOpenChange={handleOpenChange}>
		<!-- A recipe card pulled off the board, held open at the edge of the screen -->
		<Sheet.Content
			side="right"
			bind:ref={panel}
			showCloseButton={false}
			aria-label={ariaLabel}
			onOpenAutoFocus={focusPanel}
			class="bg-card text-foreground data-[side=right]:data-closed:slide-out-to-right data-[side=right]:data-open:slide-in-from-right w-full max-w-xl gap-0 border-0 text-[1rem] shadow-[-1px_0_0_var(--rule),-24px_0_48px_-24px_hsl(var(--shadow-ink)/0.55)] ease-(--ease-expo) outline-none data-closed:duration-250 data-open:duration-380 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
		>
			{@render children()}
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<Dialog.Root {open} onOpenChange={handleOpenChange}>
		<Dialog.Content
			bind:ref={panel}
			showCloseButton={false}
			aria-label={ariaLabel}
			onOpenAutoFocus={focusPanel}
			class="index-card data-closed:zoom-out-100 data-open:slide-in-from-top-3.5 data-open:zoom-in-100 fixed! block w-full max-w-[calc(100%-2rem)] space-y-5 px-6 pt-5 pb-6 text-[1rem] duration-320 ease-(--ease-expo) sm:max-w-md"
		>
			<span class="magnet" aria-hidden="true"></span>
			{@render children()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
