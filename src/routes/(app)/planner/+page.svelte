<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { actionFailureText } from '$lib/action-result';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RecipeDrawer from '$lib/components/RecipeDrawer.svelte';
	import VariationsPanel from '$lib/components/VariationsPanel.svelte';
	import WeeklyPlanner from '$lib/components/WeeklyPlanner.svelte';
	import { addWeeks } from '$lib/dates';
	import { addCustomMealSchema } from '$lib/schemas/mealPlan';
	import type { MealPlanEntryWithRecipe } from '$lib/server/services/mealPlan';
	import { DAY_LABELS } from '$lib/types';
	import type { MealSuggestion } from '$lib/types';
	import type { ActionResult } from '@sveltejs/kit';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let entries = $state<MealPlanEntryWithRecipe[]>([]);
	let pendingSuggestion = $state<MealSuggestion | null>(null);
	let selectedDay = $state<number>(0);
	let showDayPicker = $state(false);
	let isSubmitting = $state(false);

	// Custom meal modal state
	let showCustomModal = $state(false);
	let customModalDay = $state(0);

	// Variations state
	let variationsList = $state<MealSuggestion[] | null>(null);
	let variationsDay = $state<number | null>(null);
	let variationsMealName = $state('');
	let variationsLoading = $state(false);
	let drawerSuggestion = $state<MealSuggestion | null>(null);

	// Single page-level banner for failed planner actions (#166).
	let actionError = $state<string | null>(null);

	$effect(() => {
		entries = data.entries;
	});

	$effect(() => {
		const stored = sessionStorage.getItem('pendingSuggestion');
		if (stored) {
			try {
				pendingSuggestion = JSON.parse(stored) as MealSuggestion;
				showDayPicker = true;
			} catch {
				// ignore parse errors
			}
			sessionStorage.removeItem('pendingSuggestion');
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: customForm,
		errors: customErrors,
		message: customMessage,
		enhance: customEnhance,
		submitting: customSubmitting
	} = superForm(data.addCustomForm, {
		validators: zod4Client(addCustomMealSchema),
		onResult({ result }) {
			if (result.type === 'success') {
				showCustomModal = false;
				invalidateAll();
			}
		}
	});

	function handleEntryRemoved(entryId: string): void {
		actionError = null;
		entries = entries.filter((e) => e.entry.id !== entryId);
	}

	function closeDayPicker(): void {
		showDayPicker = false;
		pendingSuggestion = null;
	}

	function handleAddCustom(dayOfWeek: number): void {
		$customForm.weekStartDate = data.weekStartDate;
		$customForm.dayOfWeek = dayOfWeek;
		customModalDay = dayOfWeek;
		showCustomModal = true;
	}

	async function handleRequestVariations(dayOfWeek: number, mealName: string): Promise<void> {
		variationsDay = dayOfWeek;
		variationsMealName = mealName;
		variationsLoading = true;
		variationsList = null;

		try {
			const res = await fetch('/api/variations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ meal: mealName })
			});
			if (!res.ok) throw new Error('Failed to get variations');
			variationsList = (await res.json()) as MealSuggestion[];
		} catch {
			actionError = `Could not load variations for ${mealName}. Please try again.`;
		} finally {
			variationsLoading = false;
		}
	}

	async function handleVariationAddToPlanner(suggestion: MealSuggestion): Promise<void> {
		if (variationsDay === null) {
			actionError = 'Pick a day first: open variations from a meal in the planner.';
			return;
		}
		const fd = new FormData();
		fd.set('weekStartDate', data.weekStartDate);
		fd.set('dayOfWeek', String(variationsDay));
		fd.set('name', suggestion.name);
		fd.set('description', suggestion.description);
		fd.set('ingredientsJson', JSON.stringify(suggestion.ingredients));
		fd.set('instructionsJson', JSON.stringify(suggestion.steps));
		fd.set('prepTimeMinutes', String(suggestion.prepTimeMinutes));
		fd.set('servings', String(suggestion.servings));

		// Triggered from the variations panel / recipe drawer rather than a form, so call
		// the action programmatically — with the `x-sveltekit-action` header SvelteKit
		// answers with a serialized ActionResult instead of re-rendering the page (#167).
		let result: ActionResult;
		try {
			const res = await fetch('?/saveAndAdd', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body: fd
			});
			result = deserialize(await res.text());
		} catch {
			result = { type: 'error', error: undefined };
		}
		if (result.type !== 'success') {
			actionError = actionFailureText(
				result,
				'Could not add that meal to the planner. Please try again.'
			);
			return;
		}
		actionError = null;
		variationsList = null;
		variationsDay = null;
		drawerSuggestion = null;
		await invalidateAll();
	}

	function getWeekLabel(weekStartDate: string): string {
		const monday = new Date(weekStartDate + 'T00:00:00');
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${fmt(monday)} – ${fmt(sunday)}`;
	}

	function navigateWeek(offset: number): string {
		return '?week=' + addWeeks(data.weekStartDate, offset);
	}
</script>

<svelte:head>
	<title>Weekly Planner — MealPlanner</title>
</svelte:head>

<!-- Day picker modal for pending suggestion -->
<Modal
	open={showDayPicker && pendingSuggestion !== null}
	onClose={closeDayPicker}
	ariaLabel="Add to planner"
>
	{#if pendingSuggestion}
		<h2 class="h4 font-bold">Add to planner</h2>
		<p class="text-surface-500 text-sm">
			Adding <strong>{pendingSuggestion.name}</strong> — choose a day:
		</p>

		<form
			method="POST"
			action="?/saveAndAdd"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						actionError = null;
						showDayPicker = false;
						pendingSuggestion = null;
						await update();
					} else {
						actionError = actionFailureText(
							result,
							'Could not add that meal to the planner. Please try again.'
						);
					}
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="weekStartDate" value={data.weekStartDate} />
			<input type="hidden" name="name" value={pendingSuggestion.name} />
			<input type="hidden" name="description" value={pendingSuggestion.description} />
			<input
				type="hidden"
				name="ingredientsJson"
				value={JSON.stringify(pendingSuggestion.ingredients)}
			/>
			<input
				type="hidden"
				name="instructionsJson"
				value={JSON.stringify(pendingSuggestion.steps)}
			/>
			<input type="hidden" name="prepTimeMinutes" value={pendingSuggestion.prepTimeMinutes} />
			<input type="hidden" name="servings" value={pendingSuggestion.servings} />

			<div class="grid grid-cols-2 gap-2">
				{#each DAY_LABELS as day, i}
					<label class="flex cursor-pointer items-center gap-2">
						<input type="radio" name="dayOfWeek" value={i} bind:group={selectedDay} class="radio" />
						<span class="text-sm">{day}</span>
					</label>
				{/each}
			</div>

			<div class="flex gap-2">
				<button type="submit" disabled={isSubmitting} class="btn preset-filled-primary-500 flex-1">
					{isSubmitting ? 'Saving…' : 'Add to planner'}
				</button>
				<button type="button" onclick={closeDayPicker} class="btn preset-ghost-surface">
					Cancel
				</button>
			</div>
		</form>
	{/if}
</Modal>

<!-- Custom meal modal -->
<Modal open={showCustomModal} onClose={() => (showCustomModal = false)} ariaLabel="Add custom meal">
	<h2 class="h4 font-bold">Add meal for {DAY_LABELS[customModalDay]}</h2>

	<form method="POST" action="?/addCustom" use:customEnhance class="space-y-4">
		<input type="hidden" name="weekStartDate" value={data.weekStartDate} />
		<input type="hidden" name="dayOfWeek" value={customModalDay} />

		<AuthFormMessage message={$customMessage} />

		<label class="label space-y-1">
			<span class="text-sm font-medium">Meal name <span class="text-error-500">*</span></span>
			<input
				type="text"
				name="name"
				bind:value={$customForm.name}
				class="input"
				placeholder="e.g. Spaghetti Bolognese"
				required
			/>
			{#if $customErrors.name}
				<span class="text-error-500 text-xs">{$customErrors.name}</span>
			{/if}
		</label>

		<label class="label space-y-1">
			<span class="text-sm font-medium"
				>Notes <span class="text-surface-400 font-normal">(optional)</span></span
			>
			<textarea
				name="notes"
				bind:value={$customForm.notes}
				class="textarea"
				rows="3"
				placeholder="Any notes or description…"></textarea>
		</label>

		<div class="flex gap-2">
			<button
				type="submit"
				disabled={$customSubmitting}
				class="btn preset-filled-primary-500 flex-1"
			>
				{$customSubmitting ? 'Saving…' : 'Add meal'}
			</button>
			<button
				type="button"
				onclick={() => (showCustomModal = false)}
				class="btn preset-ghost-surface"
			>
				Cancel
			</button>
		</div>
	</form>
</Modal>

<!-- Variations panel -->
<VariationsPanel
	variations={variationsList}
	mealName={variationsMealName}
	onClose={() => {
		variationsList = null;
		variationsDay = null;
	}}
	onViewRecipe={(s) => {
		drawerSuggestion = s;
	}}
	onAddToPlanner={handleVariationAddToPlanner}
/>

<!-- Recipe drawer (for variations "View recipe") -->
<RecipeDrawer
	suggestion={drawerSuggestion}
	onClose={() => (drawerSuggestion = null)}
	onSaveToPlanner={handleVariationAddToPlanner}
/>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-10">
	<div class="flex flex-wrap items-center justify-between gap-4" in:fly={{ y: 20, duration: 300 }}>
		<div>
			<h1 class="h2 font-bold">📅 Weekly Planner</h1>
			<p class="text-surface-500 mt-1">Plan your dinners for the week</p>
		</div>

		<div class="flex items-center gap-2">
			<a href={navigateWeek(-1)} class="btn preset-ghost-surface text-sm">← Prev</a>
			<span class="px-2 text-sm font-medium">{getWeekLabel(data.weekStartDate)}</span>
			<a href={navigateWeek(1)} class="btn preset-ghost-surface text-sm">Next →</a>
		</div>
	</div>

	{#if actionError}
		<div
			class="alert preset-tonal-error flex items-center justify-between gap-4 text-sm"
			role="alert"
		>
			<span>{actionError}</span>
			<button
				type="button"
				class="btn preset-ghost-surface px-2 py-1 text-xs"
				onclick={() => (actionError = null)}
				aria-label="Dismiss error"
			>
				Dismiss
			</button>
		</div>
	{/if}

	<div in:fly={{ y: 20, delay: 100, duration: 300 }}>
		<WeeklyPlanner
			weekStartDate={data.weekStartDate}
			{entries}
			onEntryRemoved={handleEntryRemoved}
			onRemoveFailed={(text) => (actionError = text)}
			onAddCustom={handleAddCustom}
			onRequestVariations={handleRequestVariations}
			loadingVariationsDay={variationsLoading ? variationsDay : null}
		/>
	</div>

	<div in:fly={{ y: 10, delay: 200, duration: 250 }}>
		<a href="/suggest" class="btn preset-filled-primary-500"> ✨ Get more suggestions </a>
	</div>
</div>
