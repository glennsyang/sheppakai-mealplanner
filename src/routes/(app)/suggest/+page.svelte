<script lang="ts">
	import { goto } from '$app/navigation';
	import RecipeDrawer from '$lib/components/RecipeDrawer.svelte';
	import SuggestionCard from '$lib/components/SuggestionCard.svelte';
	import type { MealSuggestion } from '$lib/types';
	import { autoAnimate } from '@formkit/auto-animate';
	import { fly } from 'svelte/transition';

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

			const data = (await res.json()) as MealSuggestion[];
			suggestions = data;
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
	<title>Suggest Dinners — MealPlanner</title>
</svelte:head>

<RecipeDrawer
	suggestion={drawerSuggestion}
	onClose={() => (drawerSuggestion = null)}
	onSaveToPlanner={handleSaveToPlanner}
/>

<div class="mx-auto max-w-5xl space-y-8 px-4 py-10">
	<div in:fly={{ y: 20, duration: 300 }}>
		<h1 class="h2 font-bold">✨ Get Dinner Suggestions</h1>
		<p class="text-surface-500 mt-1">
			Select the ingredients you have available and we'll suggest some great dinners
		</p>
	</div>

	<!-- Ingredient selector -->
	<div
		class="card preset-outlined-surface-300-700 space-y-4 p-6"
		in:fly={{ y: 20, delay: 80, duration: 300 }}
	>
		<h2 class="h5 font-semibold">Your pantry items</h2>

		{#if data.pantryItems.length === 0}
			<p class="text-surface-500">
				No pantry items found.
				<a href="/pantry" class="text-primary-500 hover:underline">Add some ingredients</a>
				first.
			</p>
		{:else}
			<div class="flex flex-wrap gap-2" use:autoAnimate>
				{#each data.pantryItems as item (item.id)}
					<button
						type="button"
						onclick={() => toggleItem(item.name)}
						class="chip transition-all"
						class:preset-filled-primary-500={selectedItems.has(item.name)}
						class:preset-tonal-surface={!selectedItems.has(item.name)}
					>
						{item.name}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-4 pt-2">
				<button
					type="button"
					onclick={fetchSuggestions}
					disabled={isLoading || selectedItems.size === 0}
					class="btn preset-filled-primary-500"
				>
					{#if isLoading}
						<span class="mr-2 animate-spin">⟳</span> Finding recipes…
					{:else}
						✨ Suggest dinners ({selectedItems.size} items)
					{/if}
				</button>

				<button type="button" onclick={toggleAll} class="btn preset-ghost-surface text-sm">
					{allSelected ? 'Deselect all' : 'Select all'}
				</button>
			</div>
		{/if}
	</div>

	<!-- Error -->
	{#if error}
		<div class="alert preset-tonal-error" in:fly={{ y: 10, duration: 200 }}>
			{error}
		</div>
	{/if}

	<!-- Loading shimmer -->
	{#if isLoading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each { length: 3 } as _, i}
				<div
					class="card preset-outlined-surface-300-700 relative h-48 overflow-hidden"
					in:fly={{ y: 10, delay: i * 80, duration: 250 }}
				>
					<div class="animate-shimmer absolute inset-0"></div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Suggestions -->
	{#if suggestions.length > 0 && !isLoading}
		<div in:fly={{ y: 20, duration: 300 }}>
			<h2 class="h4 mb-4 font-semibold">
				{suggestions.length} dinner ideas for you
			</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" use:autoAnimate>
				{#each suggestions as suggestion, i (suggestion.name)}
					<SuggestionCard
						{suggestion}
						index={i}
						onViewRecipe={handleViewRecipe}
						onSaveToPlanner={handleSaveToPlanner}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
