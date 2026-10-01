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
			class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
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
			class="bg-surface-50-950 fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col shadow-2xl outline-none"
			in:fly={{ x: 420, duration: 380, easing: expoOut }}
			out:fly={{ x: 420, duration: 250, easing: expoOut }}
		>
			{@render children()}
		</div>
	{:else}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" in:fly={{ duration: 200 }}>
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onclick={onClose}
			></div>
			<div
				{@attach trapFocus}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				tabindex="-1"
				class="card preset-filled-surface-50-950 relative w-full max-w-sm space-y-5 p-6 shadow-2xl outline-none"
				in:fly={{ y: 20, duration: 250 }}
			>
				{@render children()}
			</div>
		</div>
	{/if}
{/if}
