<script lang="ts">
	import { enhance } from '$app/forms';
	import { actionFailureText } from '$lib/action-result';
	import Icon from '$lib/components/Icon.svelte';
	import { Alert } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Ingredient, MealSuggestion } from '$lib/types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { SvelteSet } from 'svelte/reactivity';

	import Modal from './Modal.svelte';

	interface Props {
		suggestion: MealSuggestion | null;
		onClose: () => void;
		/** Omitted when the recipe is already on the board. */
		onSaveToPlanner?: (suggestion: MealSuggestion) => void;
		/** The saved recipe behind `suggestion`; when set, the drawer can edit it via the planner's `updateRecipe` action. */
		recipeId?: string;
		/** Called after an edit is saved. */
		onSaved?: () => Promise<void> | void;
	}

	let { suggestion, onClose, onSaveToPlanner, recipeId, onSaved }: Props = $props();

	// Edit mode drops back to reading whenever a different recipe opens.
	let editing = $derived.by(() => {
		void suggestion;
		return false;
	});
	let saving = $state(false);
	let saveError = $state<string | null>(null);
	let draft = $state({ name: '', description: '', prepTimeMinutes: 0, servings: 1 });
	let draftIngredients = $state<Ingredient[]>([]);
	let draftSteps = $state<string[]>([]);

	const blankIngredient = (): Ingredient => ({ quantity: '', unit: '', name: '' });

	function startEditing() {
		if (!suggestion) return;
		draft = {
			name: suggestion.name,
			description: suggestion.description,
			prepTimeMinutes: suggestion.prepTimeMinutes,
			servings: suggestion.servings
		};
		draftIngredients = suggestion.ingredients.length
			? suggestion.ingredients.map((ing) => ({ ...ing }))
			: [blankIngredient()];
		draftSteps = suggestion.steps.length ? [...suggestion.steps] : [''];
		saveError = null;
		editing = true;
	}

	const filledIngredients = $derived(
		draftIngredients
			.map((ing) => ({
				quantity: ing.quantity.trim(),
				unit: ing.unit.trim(),
				name: ing.name.trim()
			}))
			.filter((ing) => ing.name)
	);
	const filledSteps = $derived(draftSteps.map((step) => step.trim()).filter(Boolean));

	const saveEnhance: SubmitFunction = ({ cancel }) => {
		if (saving) return cancel();
		saving = true;
		saveError = null;
		return async ({ result }) => {
			saving = false;
			if (result.type === 'success') {
				editing = false;
				await onSaved?.();
			} else {
				saveError = actionFailureText(result, 'Could not save that recipe. Please try again.');
			}
		};
	};

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
			<div class="flex shrink-0 items-center gap-1">
				{#if recipeId && !editing}
					<button type="button" onclick={startEditing} class="close" aria-label="Edit recipe">
						<Icon name="pencil" size={18} />
					</button>
				{/if}
				<button type="button" onclick={onClose} class="close" aria-label="Close recipe">
					<Icon name="x" size={20} />
				</button>
			</div>
		</div>

		{#if editing}
			<form
				method="POST"
				action="/planner?/updateRecipe"
				use:enhance={saveEnhance}
				class="flex min-h-0 flex-1 flex-col"
			>
				<input type="hidden" name="recipeId" value={recipeId} />
				<input type="hidden" name="ingredientsJson" value={JSON.stringify(filledIngredients)} />
				<input type="hidden" name="instructionsJson" value={JSON.stringify(filledSteps)} />

				<div class="flex-1 space-y-8 overflow-y-auto px-6 py-7 sm:px-8">
					{#if saveError}
						<Alert variant="destructive" role="alert">{saveError}</Alert>
					{/if}

					<div class="space-y-4">
						<Label class="space-y-1.5">
							<span class="font-semibold">Name</span>
							<Input type="text" name="name" bind:value={draft.name} maxlength={200} required />
						</Label>

						<Label class="space-y-1.5">
							<span class="font-semibold"
								>Notes <span class="ink-faint font-normal">(optional)</span></span
							>
							<Textarea
								name="description"
								bind:value={draft.description}
								rows={3}
								maxlength={2000}
							/>
						</Label>

						<div class="grid grid-cols-2 gap-4">
							<Label class="space-y-1.5">
								<span class="font-semibold">Prep (min)</span>
								<Input
									type="number"
									name="prepTimeMinutes"
									bind:value={draft.prepTimeMinutes}
									class="tabular"
									min={0}
									max={1440}
									required
								/>
							</Label>
							<Label class="space-y-1.5">
								<span class="font-semibold">Serves</span>
								<Input
									type="number"
									name="servings"
									bind:value={draft.servings}
									class="tabular"
									min={1}
									max={100}
									required
								/>
							</Label>
						</div>
					</div>

					<fieldset class="space-y-2">
						<legend class="marker ink-red mb-3 text-xl">Ingredients</legend>
						{#each draftIngredients as ing, i (i)}
							<div class="ing-row">
								<Input
									type="text"
									bind:value={ing.quantity}
									placeholder="2"
									maxlength={50}
									aria-label="Ingredient {i + 1} quantity"
								/>
								<Input
									type="text"
									bind:value={ing.unit}
									placeholder="cups"
									maxlength={50}
									aria-label="Ingredient {i + 1} unit"
								/>
								<Input
									type="text"
									bind:value={ing.name}
									placeholder="rice"
									maxlength={200}
									aria-label="Ingredient {i + 1} name"
								/>
								<button
									type="button"
									class="row-remove"
									onclick={() => draftIngredients.splice(i, 1)}
									aria-label="Remove ingredient {i + 1}"
								>
									<Icon name="x" size={16} />
								</button>
							</div>
						{/each}
						{#if draftIngredients.length < 50}
							<button
								type="button"
								class="act-text ink-blue inline-flex items-center gap-1.5 text-sm"
								onclick={() => draftIngredients.push(blankIngredient())}
							>
								<Icon name="plus" size={16} />Add an ingredient
							</button>
						{/if}
					</fieldset>

					<fieldset class="space-y-3">
						<legend class="marker ink-red mb-3 text-xl">Method</legend>
						{#each draftSteps as _, i (i)}
							<div class="step-row">
								<span class="marker ink-blue tabular pt-2 text-xl leading-none" aria-hidden="true"
									>{i + 1}</span
								>
								<Textarea
									bind:value={draftSteps[i]}
									rows={2}
									maxlength={2000}
									aria-label="Step {i + 1}"
								/>
								<button
									type="button"
									class="row-remove"
									onclick={() => draftSteps.splice(i, 1)}
									aria-label="Remove step {i + 1}"
								>
									<Icon name="x" size={16} />
								</button>
							</div>
						{/each}
						{#if draftSteps.length < 50}
							<button
								type="button"
								class="act-text ink-blue inline-flex items-center gap-1.5 text-sm"
								onclick={() => draftSteps.push('')}
							>
								<Icon name="plus" size={16} />Add a step
							</button>
						{/if}
					</fieldset>
				</div>

				<div class="foot flex gap-2 px-6 py-4 sm:px-8">
					<Button type="submit" disabled={saving} class="flex-1 py-3">
						{saving ? 'Saving…' : 'Save recipe'}
					</Button>
					<Button
						type="button"
						disabled={saving}
						onclick={() => (editing = false)}
						variant="outline"
						class="py-3"
					>
						Cancel
					</Button>
				</div>
			</form>
		{:else}
			<div class="flex-1 space-y-10 overflow-y-auto px-6 py-7 sm:px-8">
				{#if suggestion.description}
					<p class="ink-soft max-w-[60ch] text-[1.05rem] leading-relaxed">
						{suggestion.description}
					</p>
				{/if}

				{#if suggestion.ingredients.length === 0 && suggestion.steps.length === 0}
					<div class="space-y-3">
						<p class="marker ink-faint text-lg">Written in by hand. There's no recipe on file.</p>
						{#if recipeId}
							<Button type="button" onclick={startEditing} variant="outline" class="px-4 py-2">
								<Icon name="pencil" size={16} />
								Add the recipe
							</Button>
						{/if}
					</div>
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
					<Button type="button" onclick={() => onSaveToPlanner(suggestion)} class="w-full py-3">
						<Icon name="calendar" />
						Put it on the week
					</Button>
				</div>
			{/if}
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

	.ing-row {
		display: grid;
		grid-template-columns: 4rem 5rem minmax(0, 1fr) 2.5rem;
		gap: 0.5rem;
		align-items: center;
	}
	.step-row {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr) 2.5rem;
		gap: 0.5rem;
		align-items: start;
	}
	.row-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 8px;
		color: var(--ink-faint);
	}
	.row-remove:hover {
		color: var(--marker-red);
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
