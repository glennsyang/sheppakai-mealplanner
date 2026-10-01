<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import RecipeDrawer from '$lib/components/RecipeDrawer.svelte';
	import SuggestionCard from '$lib/components/SuggestionCard.svelte';
	import { mealSuggestionListSchema } from '$lib/schemas/mealPlan';
	import { magnetTilt } from '$lib/tilt';
	import type { MealSuggestion } from '$lib/types';
	import { autoAnimate } from '@formkit/auto-animate';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Track what the user switched *off* rather than what's on: every pantry item is
	// selected by default (including ones added later), and the user's choices survive
	// load invalidations instead of being reset by an effect (#168).
	let deselected = $state<Set<string>>(new Set());
	const selectedItems = $derived(
		new Set(data.pantryItems.map((i) => i.name).filter((name) => !deselected.has(name)))
	);
	const allSelected = $derived(data.pantryItems.every((i) => !deselected.has(i.name)));

	let suggestions = $state<MealSuggestion[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let drawerSuggestion = $state<MealSuggestion | null>(null);

	function toggleItem(name: string) {
		const next = new Set(deselected);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		deselected = next;
	}

	function toggleAll() {
		deselected = allSelected ? new Set(data.pantryItems.map((i) => i.name)) : new Set();
	}

	async function fetchSuggestions() {
		if (selectedItems.size === 0) return;
		isLoading = true;
		error = null;
		suggestions = [];

		try {
			const res = await fetch('/api/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: Array.from(selectedItems) })
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { message?: string };
				throw new Error(body.message ?? 'Failed to get suggestions');
			}

			const parsed = mealSuggestionListSchema.safeParse(await res.json());
			if (!parsed.success) throw new Error('Got an unexpected response. Please try again.');
			suggestions = parsed.data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	function handleViewRecipe(suggestion: MealSuggestion) {
		drawerSuggestion = suggestion;
	}

	// The planner page picks the suggestion up from sessionStorage and opens its day picker.
	function handleSaveToPlanner(suggestion: MealSuggestion) {
		sessionStorage.setItem('pendingSuggestion', JSON.stringify(suggestion));
		goto('/planner');
	}
</script>

<svelte:head>
	<title>Suggest Dinners — Meal Planner</title>
</svelte:head>

<RecipeDrawer
	suggestion={drawerSuggestion}
	onClose={() => (drawerSuggestion = null)}
	onSaveToPlanner={handleSaveToPlanner}
/>

<div class="px-5 pt-8 pb-10 sm:px-10 sm:pt-12">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight sm:text-[2.5rem]">
		What's for dinner?
	</h1>

	{#if data.pantryItems.length === 0}
		<p class="ink-soft mt-3 max-w-[52ch] text-lg leading-relaxed">
			Ideas come from what's in the kitchen, and the pantry is empty.
		</p>
		<a href="/pantry" class="btn act mt-6 px-5 py-2.5">
			<Icon name="basket" />
			Fill the pantry
		</a>
	{:else}
		<p class="ink-soft mt-2 max-w-[56ch] text-lg leading-relaxed">
			Every ingredient on the fridge is in. Tap a magnet to leave it out.
		</p>

		<ul
			class="mt-7 flex flex-wrap gap-x-2.5 gap-y-3"
			use:autoAnimate
			aria-label="Pantry ingredients"
		>
			{#each data.pantryItems as item (item.id)}
				{@const on = selectedItems.has(item.name)}
				<li>
					<button
						type="button"
						onclick={() => toggleItem(item.name)}
						class="tile px-3 py-1.5 text-[1.05rem] font-semibold"
						class:tile-off={!on}
						style="--tilt: {magnetTilt(item.name)}deg"
						aria-pressed={on}
					>
						<span class="tile-word">{item.name}</span>
					</button>
				</li>
			{/each}
		</ul>

		<div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
			<button
				type="button"
				onclick={fetchSuggestions}
				disabled={isLoading || selectedItems.size === 0}
				class="btn act px-6 py-3 text-lg"
			>
				{#if isLoading}
					<Icon name="loader" size={20} class="animate-spin" />
					Thinking it over…
				{:else}
					<Icon name="sparkles" size={20} />
					Suggest dinners
				{/if}
			</button>
			<span class="ink-soft tabular text-sm font-semibold">
				using {selectedItems.size} of {data.pantryItems.length}
			</span>
			<button type="button" onclick={toggleAll} class="act-text ink-blue text-sm">
				{allSelected ? 'Leave them all out' : 'Put them all back'}
			</button>
		</div>
	{/if}
</div>

{#if error || isLoading || suggestions.length > 0}
	<section class="results px-5 pt-8 pb-12 sm:px-10" aria-live="polite" aria-busy={isLoading}>
		{#if error}
			<div class="alert preset-tonal-error" role="alert">{error}</div>
		{/if}

		{#if isLoading}
			<p class="marker ink-soft mb-8 text-xl">Writing up a few ideas…</p>
			<div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				{#each { length: 3 } as _, i (i)}
					<div class="index-card px-5 pt-6 pb-6" style="rotate: {[-0.5, 0.4, -0.2][i]}deg">
						<span class="magnet opacity-60"></span>
						<div class="card-head space-y-2.5 pb-4">
							<div class="writing-line w-3/4"></div>
							<div class="writing-line w-1/3"></div>
						</div>
						<div class="space-y-3 pt-4">
							<div class="writing-line"></div>
							<div class="writing-line w-5/6"></div>
							<div class="writing-line w-2/3"></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if suggestions.length > 0 && !isLoading}
			<h2 class="mb-8 flex items-baseline gap-3">
				<span class="marker ink-green text-2xl">{suggestions.length} ideas</span>
				<span class="ink-soft text-sm font-semibold"
					>Put one on the week, or read the recipe first.</span
				>
			</h2>
			<div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" use:autoAnimate>
				{#each suggestions as suggestion, i (suggestion.name)}
					<SuggestionCard
						{suggestion}
						index={i}
						onViewRecipe={handleViewRecipe}
						onSaveToPlanner={handleSaveToPlanner}
					/>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.results {
		border-top: 1px solid var(--rule-strong);
	}
</style>
