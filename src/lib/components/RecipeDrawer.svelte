<script lang="ts">
	import { fly } from 'svelte/transition';
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
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={() => {}}
		in:fly={{ duration: 200 }}
		out:fly={{ duration: 150 }}
	></div>

	<!-- Drawer panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface-50-950 shadow-2xl"
		in:fly={{ x: 400, duration: 300 }}
		out:fly={{ x: 400, duration: 200 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-surface-200-800 p-5">
			<div>
				<h2 class="h3 font-bold">{suggestion.name}</h2>
				<div class="mt-1 flex gap-3 text-sm text-surface-500">
					<span>⏱ {suggestion.prepTimeMinutes} min</span>
					<span>🍽 {suggestion.servings} servings</span>
				</div>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="btn preset-ghost-surface rounded-full p-2"
				aria-label="Close recipe drawer"
			>
				✕
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto p-5 space-y-6">
			<p class="text-surface-600-400 leading-relaxed">{suggestion.description}</p>

			<!-- Ingredients -->
			<section>
				<h3 class="h5 font-semibold mb-3">Ingredients</h3>
				<ul class="space-y-1.5">
					{#each suggestion.ingredients as ing}
						<li class="flex items-center gap-2 text-sm">
							<span class="size-1.5 rounded-full bg-primary-500 shrink-0"></span>
							<span class="font-medium">{ing.quantity} {ing.unit}</span>
							<span class="text-surface-600-400">{ing.name}</span>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Steps -->
			<section>
				<h3 class="h5 font-semibold mb-3">Instructions</h3>
				<ol class="space-y-3">
					{#each suggestion.steps as step, i}
						<li class="flex gap-3 text-sm">
							<span
								class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white"
							>
								{i + 1}
							</span>
							<span class="leading-relaxed pt-0.5">{step}</span>
						</li>
					{/each}
				</ol>
			</section>
		</div>

		<!-- Footer -->
		<div class="border-t border-surface-200-800 p-5">
			<button
				type="button"
				onclick={() => onSaveToPlanner(suggestion!)}
				class="btn preset-filled-primary-500 w-full"
			>
				Add to Weekly Planner
			</button>
		</div>
	</div>
{/if}
