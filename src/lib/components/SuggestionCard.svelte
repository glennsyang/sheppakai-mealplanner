<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { MealSuggestion } from '$lib/types';

	interface Props {
		suggestion: MealSuggestion;
		index: number;
		onViewRecipe: (suggestion: MealSuggestion) => void;
		onSaveToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { suggestion, index, onViewRecipe, onSaveToPlanner }: Props = $props();

	const KEY_INGREDIENTS = 4;
	const keyIngredients = $derived(suggestion.ingredients.slice(0, KEY_INGREDIENTS));
	const moreCount = $derived(Math.max(0, suggestion.ingredients.length - KEY_INGREDIENTS));
	// Cards are stuck on one after another, and each hangs a hair off true.
	const tilt = $derived([-0.6, 0.45, -0.25, 0.7, -0.5][index % 5]);
</script>

<article
	class="index-card animate-stick flex flex-col"
	style="animation-delay: {index * 110}ms; rotate: {tilt}deg"
>
	<span class="magnet" class:magnet-blue={index % 3 === 1} class:magnet-green={index % 3 === 2}
	></span>

	<header class="card-head px-5 pt-6 pb-3">
		<h3 class="text-[1.3rem] leading-snug font-bold tracking-tight">{suggestion.name}</h3>
		<div class="ink-soft mt-2 flex gap-4 text-sm font-semibold">
			<span class="tabular inline-flex items-center gap-1.5">
				<Icon name="clock" size={15} />{suggestion.prepTimeMinutes} min
			</span>
			<span class="tabular inline-flex items-center gap-1.5">
				<Icon name="servings" size={15} />Serves {suggestion.servings}
			</span>
		</div>
	</header>

	<div class="flex flex-1 flex-col gap-3 px-5 pt-3 pb-5">
		<p class="ink-soft line-clamp-3 leading-relaxed">{suggestion.description}</p>
		{#if keyIngredients.length > 0}
			<p class="text-sm leading-relaxed">
				<span class="marker ink-blue">uses</span>
				{keyIngredients.map((ing) => ing.name).join(', ')}{#if moreCount > 0}<span class="ink-faint"
						>, +{moreCount} more</span
					>{/if}
			</p>
		{/if}

		<div class="mt-auto flex flex-wrap gap-2 pt-2">
			<Button
				type="button"
				onclick={() => onSaveToPlanner(suggestion)}
				class="flex-1 text-[0.95rem]"
			>
				Put on the week
			</Button>
			<Button
				type="button"
				onclick={() => onViewRecipe(suggestion)}
				variant="outline"
				class="text-[0.95rem]"
			>
				<Icon name="book" size={16} />
				Recipe
			</Button>
		</div>
	</div>
</article>
