<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { MealSuggestion } from '$lib/types';
	import { SvelteSet } from 'svelte/reactivity';

	import Modal from './Modal.svelte';

	interface Props {
		suggestion: MealSuggestion | null;
		onClose: () => void;
		/** Omitted when the recipe is already on the board. */
		onSaveToPlanner?: (suggestion: MealSuggestion) => void;
	}

	let { suggestion, onClose, onSaveToPlanner }: Props = $props();

	// Ingredients ticked off while cooking; cleared whenever a different recipe opens.
	const gathered = $derived.by(() => {
		void suggestion;
		return new SvelteSet<number>();
	});

	function toggleGathered(i: number) {
		if (gathered.has(i)) gathered.delete(i);
		else gathered.add(i);
	}
</script>

<Modal
	open={suggestion !== null}
	{onClose}
	ariaLabel={suggestion ? `Recipe: ${suggestion.name}` : 'Recipe'}
	variant="drawer"
>
	{#if suggestion}
		<div class="head flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-8">
			<div class="min-w-0 space-y-3">
				<h2 class="text-[1.75rem] leading-[1.15] font-bold tracking-tight sm:text-[2rem]">
					{suggestion.name}
				</h2>
				<div class="ink-soft flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
					<span class="tabular inline-flex items-center gap-1.5">
						<Icon name="clock" size={16} />{suggestion.prepTimeMinutes} min
					</span>
					<span class="tabular inline-flex items-center gap-1.5">
						<Icon name="servings" size={16} />Serves {suggestion.servings}
					</span>
				</div>
			</div>
			<button type="button" onclick={onClose} class="close" aria-label="Close recipe">
				<Icon name="x" size={20} />
			</button>
		</div>

		<div class="flex-1 space-y-10 overflow-y-auto px-6 py-7 sm:px-8">
			{#if suggestion.description}
				<p class="ink-soft max-w-[60ch] text-[1.05rem] leading-relaxed">
					{suggestion.description}
				</p>
			{/if}

			{#if suggestion.ingredients.length === 0 && suggestion.steps.length === 0}
				<p class="marker ink-faint text-lg">Written in by hand. There's no recipe on file.</p>
			{/if}

			{#if suggestion.ingredients.length > 0}
				<section aria-labelledby="ingredients-heading">
					<div class="mb-3 flex items-baseline justify-between gap-4">
						<h3 id="ingredients-heading" class="marker ink-red text-xl">Ingredients</h3>
						<span class="ink-faint tabular text-sm" aria-live="polite">
							{gathered.size} of {suggestion.ingredients.length} out
						</span>
					</div>
					<ul class="ruled">
						{#each suggestion.ingredients as ing, i (i)}
							<li>
								<button
									type="button"
									class="ingredient"
									aria-pressed={gathered.has(i)}
									onclick={() => toggleGathered(i)}
								>
									<span class="tick" aria-hidden="true">
										{#if gathered.has(i)}<Icon name="check" size={14} />{/if}
									</span>
									<span class="qty tabular">{ing.quantity} {ing.unit}</span>
									<span class="name">{ing.name}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if suggestion.steps.length > 0}
				<section aria-labelledby="steps-heading">
					<h3 id="steps-heading" class="marker ink-red mb-4 text-xl">Method</h3>
					<ol class="space-y-6">
						{#each suggestion.steps as step, i (i)}
							<li class="grid grid-cols-[2rem_1fr] gap-3">
								<span class="marker ink-blue tabular text-2xl leading-none" aria-hidden="true"
									>{i + 1}</span
								>
								<p class="max-w-[62ch] text-[1.1rem] leading-[1.6]">{step}</p>
							</li>
						{/each}
					</ol>
				</section>
			{/if}
		</div>

		{#if onSaveToPlanner}
			<div class="foot px-6 py-4 sm:px-8">
				<button
					type="button"
					onclick={() => onSaveToPlanner(suggestion)}
					class="btn act w-full py-3"
				>
					<Icon name="calendar" />
					Put it on the week
				</button>
			</div>
		{/if}
	{/if}
</Modal>

<style>
	/* Index-card head rule in red marker */
	.head {
		border-bottom: 1.5px solid var(--marker-red);
	}
	.foot {
		border-top: 1px solid var(--rule);
		padding-bottom: calc(1rem + env(safe-area-inset-bottom));
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

	.ingredient {
		display: grid;
		grid-template-columns: 1.375rem minmax(4.5rem, auto) 1fr;
		align-items: baseline;
		gap: 0.75rem;
		width: 100%;
		padding: 0.7rem 0;
		text-align: left;
		font-size: 1.05rem;
	}
	.tick {
		align-self: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 4px;
		box-shadow: inset 0 0 0 1.5px var(--rule-strong);
		color: var(--marker-green);
	}
	.qty {
		font-weight: 700;
	}
	.name {
		color: var(--ink-soft);
	}
	.ingredient[aria-pressed='true'] .tick {
		box-shadow: inset 0 0 0 1.5px var(--marker-green);
	}
	.ingredient[aria-pressed='true'] .qty,
	.ingredient[aria-pressed='true'] .name {
		color: var(--ink-faint);
		text-decoration: line-through;
		text-decoration-thickness: 1.5px;
	}
</style>
