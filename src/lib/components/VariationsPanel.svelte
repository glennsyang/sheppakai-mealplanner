<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { MealSuggestion } from '$lib/types';

	import Modal from './Modal.svelte';
	import SuggestionCard from './SuggestionCard.svelte';

	interface Props {
		variations: MealSuggestion[] | null;
		mealName: string;
		onClose: () => void;
		onViewRecipe: (suggestion: MealSuggestion) => void;
		onAddToPlanner: (suggestion: MealSuggestion) => void;
	}

	let { variations, mealName, onClose, onViewRecipe, onAddToPlanner }: Props = $props();
</script>

<Modal open={variations !== null} {onClose} ariaLabel="Variations for {mealName}" variant="drawer">
	{#if variations}
		<div class="head flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-8">
			<div class="min-w-0 space-y-1">
				<h2 class="text-[1.6rem] leading-tight font-bold tracking-tight">Other ways to make it</h2>
				<p class="ink-soft">
					Twists on <span class="marker ink-blue">{mealName}</span>
				</p>
			</div>
			<button type="button" onclick={onClose} class="close" aria-label="Close variations">
				<Icon name="x" size={20} />
			</button>
		</div>

		<div class="board-well flex-1 space-y-8 overflow-y-auto px-6 pt-9 pb-8 sm:px-8">
			{#each variations as variation, i (variation.name)}
				<SuggestionCard
					suggestion={variation}
					index={i}
					{onViewRecipe}
					onSaveToPlanner={onAddToPlanner}
				/>
			{/each}
		</div>
	{/if}
</Modal>

<style>
	.head {
		border-bottom: 1.5px solid var(--marker-red);
	}
	/* The cards sit on a patch of board inside the sheet */
	.board-well {
		background: var(--board);
	}
	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.75rem;
		height: 2.75rem;
		margin: -0.25rem -0.5rem 0 0;
		border-radius: 999px;
		color: var(--ink-soft);
	}
	.close:hover {
		color: var(--ink);
		background: color-mix(in oklch, var(--ink) 7%, transparent);
	}
</style>
