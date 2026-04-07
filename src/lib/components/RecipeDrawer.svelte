<script lang="ts">
	import { fly } from 'svelte/transition';
	import { expoOut, linear } from 'svelte/easing';
	import type { MealSuggestion } from '$lib/types';

	interface Props {
		suggestion: MealSuggestion | null;
		onClose: () => void;
		onSaveToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { suggestion, onClose, onSaveToPlanner }: Props = $props();

	const isOpen = $derived(suggestion !== null);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && suggestion}
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

	<!-- Drawer panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface-50-950 shadow-2xl"
		in:fly={{ x: 420, duration: 380, easing: expoOut }}
		out:fly={{ x: 420, duration: 250, easing: expoOut }}
	>
		<!-- Header -->
		<div class="flex items-start justify-between border-b border-surface-200-800 px-6 py-5 gap-4">
			<div class="space-y-1.5">
				<h2 class="font-serif text-2xl font-semibold leading-snug tracking-tight">{suggestion.name}</h2>
				<div class="flex gap-4 text-xs text-surface-400 font-medium">
					<span>{suggestion.prepTimeMinutes} min prep</span>
					<span>·</span>
					<span>{suggestion.servings} servings</span>
				</div>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="flex size-8 shrink-0 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100-900 hover:text-surface-950-50 mt-0.5"
				aria-label="Close recipe"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
			<!-- Description -->
			<p class="text-surface-600-400 leading-relaxed font-light italic text-sm">{suggestion.description}</p>

			<!-- Ingredients -->
			<section>
				<h3 class="font-serif text-lg font-semibold mb-4 tracking-tight">Ingredients</h3>
				<ul class="space-y-2">
					{#each suggestion.ingredients as ing}
						<li class="flex items-baseline gap-3 text-sm">
							<span class="w-1 h-1 rounded-full bg-primary-500 shrink-0 mt-2"></span>
							<span class="font-medium tabular-nums text-surface-950-50">{ing.quantity} {ing.unit}</span>
							<span class="text-surface-500 font-light">{ing.name}</span>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Steps -->
			<section>
				<h3 class="font-serif text-lg font-semibold mb-4 tracking-tight">Instructions</h3>
				<ol class="space-y-4">
					{#each suggestion.steps as step, i}
						<li class="flex gap-4 text-sm">
							<span class="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary-500 text-primary-500 text-xs font-semibold tabular-nums mt-0.5">
								{i + 1}
							</span>
							<span class="leading-relaxed text-surface-700-300 font-light pt-0.5">{step}</span>
						</li>
					{/each}
				</ol>
			</section>
		</div>

		<!-- Footer -->
		<div class="border-t border-surface-200-800 px-6 py-4">
			<button
				type="button"
				onclick={() => onSaveToPlanner(suggestion!)}
				class="btn preset-filled-primary-500 w-full"
			>
				Add to weekly planner
			</button>
		</div>
	</div>
{/if}
