<script lang="ts" module>
	// Open modals, oldest first. Escape closes only the topmost one, so a recipe drawer
	// opened from the variations panel doesn't take the panel down with it.
	const openStack: symbol[] = [];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { expoOut, linear } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	interface Props {
		open: boolean;
		onClose: () => void;
		ariaLabel: string;
		/** `dialog`: centered card. `drawer`: full-height panel sliding in from the right. */
		variant?: 'dialog' | 'drawer';
		children: Snippet;
	}

	let { open, onClose, ariaLabel, variant = 'dialog', children }: Props = $props();

	const id = Symbol('modal');

	// Registers on the stack and moves focus into the panel while mounted (i.e. while
	// open); restores focus to whatever had it before on close.
	const trapFocus: Attachment<HTMLElement> = (panel) => {
		const previouslyFocused = document.activeElement as HTMLElement | null;
		openStack.push(id);
		panel.focus();
		return () => {
			openStack.splice(openStack.indexOf(id), 1);
			previouslyFocused?.focus?.();
		};
	};

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape' && openStack.at(-1) === id) {
			e.preventDefault();
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	{#if variant === 'drawer'}
		<!-- Backdrop: a mouse convenience only; keyboard users close with Escape or the
		     panel's close button, so it's hidden from assistive tech. -->
		<div
			aria-hidden="true"
			class="scrim fixed inset-0 z-40"
			onclick={onClose}
			in:fly={{ duration: 250, easing: linear }}
			out:fly={{ duration: 200, easing: linear }}
		></div>

		<div
			{@attach trapFocus}
			role="dialog"
			aria-modal="true"
			aria-label={ariaLabel}
			tabindex="-1"
			class="sheet fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col outline-none"
			in:fly={{ x: 420, duration: 380, easing: expoOut }}
			out:fly={{ x: 420, duration: 250, easing: expoOut }}
		>
			{@render children()}
		</div>
	{:else}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" in:fly={{ duration: 200 }}>
			<div aria-hidden="true" class="scrim absolute inset-0" onclick={onClose}></div>
			<div
				{@attach trapFocus}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				tabindex="-1"
				class="index-card relative w-full max-w-md space-y-5 px-6 pt-5 pb-6 outline-none"
				in:fly={{ y: -14, duration: 320, easing: expoOut }}
			>
				<span class="magnet" aria-hidden="true"></span>
				{@render children()}
			</div>
		</div>
	{/if}
{/if}

<style>
	.scrim {
		background: color-mix(in oklch, var(--door) 35%, oklch(10% 0.01 260deg / 0.55));
	}
	/* A recipe card pulled off the board, held open at the edge of the screen */
	.sheet {
		background: var(--card);
		box-shadow:
			-1px 0 0 var(--rule),
			-24px 0 48px -24px hsl(var(--shadow-ink) / 0.55);
	}
</style>
