<script lang="ts">
	import { fly } from 'svelte/transition';
	import { expoOut, linear } from 'svelte/easing';
	import type { MealSuggestion } from '$lib/types';
	import SuggestionCard from './SuggestionCard.svelte';

	interface Props {
		variations: MealSuggestion[] | null;
		mealName: string;
		onClose: () => void;
		onViewRecipe: (suggestion: MealSuggestion) => void;
		onAddToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { variations, mealName, onClose, onViewRecipe, onAddToPlanner }: Props = $props();

	const isOpen = $derived(variations !== null);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && variations}
	<!-- Backdrop -->
	<div
		role="button"
		tabindex="-1"
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={() => {}}
		in:fly={{ duration: 250, easing: linear }}
		out:fly={{ duration: 200, easing: linear }}
	></div>

	<!-- Panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface-50-950 shadow-2xl"
		in:fly={{ x: 420, duration: 380, easing: expoOut }}
		out:fly={{ x: 420, duration: 250, easing: expoOut }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-surface-200-800 px-6 py-5 gap-4">
			<div class="space-y-0.5">
				<h2 class="font-serif text-xl font-semibold leading-snug tracking-tight">Variations</h2>
				<p class="text-sm text-surface-500 font-light">for {mealName}</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="flex size-8 shrink-0 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100-900 hover:text-surface-950-50"
				aria-label="Close variations panel"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto px-6 py-6 space-y-4">
			{#each variations as variation, i}
				<SuggestionCard
					suggestion={variation}
					index={i}
					onViewRecipe={onViewRecipe}
					onSaveToPlanner={onAddToPlanner}
				/>
			{/each}
		</div>
	</div>
{/if}
