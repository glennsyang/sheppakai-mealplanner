<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import type { MealSuggestion } from '$lib/types';

	interface Props {
		suggestion: MealSuggestion;
		index: number;
		onViewRecipe: (suggestion: MealSuggestion) => void;
		onSaveToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { suggestion, index, onViewRecipe, onSaveToPlanner }: Props = $props();

	const delay = $derived(index * 100);
</script>

<div
	in:fly={{ y: 20, delay, duration: 350 }}
	out:scale={{ duration: 200 }}
	class="card preset-outlined-surface-500 animate-card-enter flex flex-col gap-3 p-5 hover:shadow-lg transition-shadow"
	style="animation-delay: {delay}ms"
>
	<div class="flex items-start justify-between gap-3">
		<div>
			<h3 class="h4 font-bold">{suggestion.name}</h3>
			<p class="text-surface-600-400 mt-1 text-sm leading-relaxed">{suggestion.description}</p>
		</div>
		<div class="flex flex-col items-end gap-1 shrink-0">
			<span class="badge preset-tonal-secondary text-xs">⏱ {suggestion.prepTimeMinutes} min</span>
			<span class="badge preset-tonal-surface text-xs">🍽 {suggestion.servings} servings</span>
		</div>
	</div>

	<div>
		<p class="text-surface-500 text-xs font-semibold uppercase tracking-wide mb-1.5">
			Key ingredients
		</p>
		<div class="flex flex-wrap gap-1.5">
			{#each suggestion.ingredients.slice(0, 5) as ing}
				<span class="chip preset-tonal-surface text-xs">{ing.name}</span>
			{/each}
			{#if suggestion.ingredients.length > 5}
				<span class="chip preset-tonal-surface text-xs">+{suggestion.ingredients.length - 5} more</span>
			{/if}
		</div>
	</div>

	<div class="flex gap-2 mt-auto pt-1">
		<button
			type="button"
			onclick={() => onViewRecipe(suggestion)}
			class="btn preset-outlined-surface-500 flex-1 text-sm"
		>
			View Recipe
		</button>
		<button
			type="button"
			onclick={() => onSaveToPlanner(suggestion)}
			class="btn preset-filled-primary-500 flex-1 text-sm"
		>
			Add to Planner
		</button>
	</div>
</div>
