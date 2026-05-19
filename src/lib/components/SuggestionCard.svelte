<script lang="ts">
	import type { MealSuggestion } from '$lib/types';
	import { expoOut } from 'svelte/easing';
	import { fly, scale } from 'svelte/transition';

	interface Props {
		suggestion: MealSuggestion;
		index: number;
		onViewRecipe: (suggestion: MealSuggestion) => void;
		onSaveToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { suggestion, index, onViewRecipe, onSaveToPlanner }: Props = $props();

	const delay = $derived(index * 90);
</script>

<div
	in:fly={{ y: 24, delay, duration: 500, easing: expoOut }}
	out:scale={{ duration: 200 }}
	class="card preset-outlined-surface-300-700 card-lift flex flex-col gap-4 overflow-hidden p-6"
	style="animation-delay: {delay}ms"
>
	<!-- Header: name + metadata -->
	<div class="flex items-start justify-between gap-4">
		<h3 class="flex-1 font-serif text-xl leading-snug font-semibold tracking-tight">
			{suggestion.name}
		</h3>
		<div class="flex shrink-0 flex-col items-end gap-1 pt-0.5">
			<span class="text-surface-400 text-xs font-medium tabular-nums"
				>{suggestion.prepTimeMinutes} min</span
			>
			<span class="text-surface-400 text-xs">{suggestion.servings} servings</span>
		</div>
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col gap-4">
		<!-- Description -->
		<p class="text-surface-500 text-sm leading-relaxed font-light">{suggestion.description}</p>

		<!-- Key ingredients -->
		<div>
			<p class="text-surface-400 mb-2 text-xs font-medium tracking-widest uppercase">
				Key ingredients
			</p>
			<div class="flex flex-wrap gap-1.5">
				{#each suggestion.ingredients.slice(0, 5) as ing}
					<span class="chip preset-tonal-surface text-xs font-light">{ing.name}</span>
				{/each}
				{#if suggestion.ingredients.length > 5}
					<span class="chip preset-outlined-surface-300-700 text-xs font-light"
						>+{suggestion.ingredients.length - 5} more</span
					>
				{/if}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="grid grid-cols-2 gap-2 pt-1">
		<button
			type="button"
			onclick={() => onViewRecipe(suggestion)}
			class="btn preset-outlined-surface-500 min-w-0 text-sm"
		>
			View recipe
		</button>
		<button
			type="button"
			onclick={() => onSaveToPlanner(suggestion)}
			class="btn preset-filled-primary-500 min-w-0 text-sm"
		>
			Add to planner
		</button>
	</div>
</div>
