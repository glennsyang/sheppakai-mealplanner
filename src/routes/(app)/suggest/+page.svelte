<script lang="ts">
	import { fly } from 'svelte/transition';
	import { autoAnimate } from '@formkit/auto-animate';
	import SuggestionCard from '$lib/components/SuggestionCard.svelte';
	import RecipeDrawer from '$lib/components/RecipeDrawer.svelte';
	import type { MealSuggestion } from '$lib/types';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let selectedItems = $state<Set<string>>(new Set());

	$effect(() => {
		selectedItems = new Set(data.pantryItems.map((i) => i.name));
	});
	let suggestions = $state<MealSuggestion[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let drawerSuggestion = $state<MealSuggestion | null>(null);
	let plannerSuggestion = $state<MealSuggestion | null>(null);

	function toggleItem(name: string) {
		const next = new Set(selectedItems);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		selectedItems = next;
	}

	async function fetchSuggestions() {
		if (selectedItems.size === 0) return;
		isLoading = true;
		error = null;
		suggestions = [];

		try {
			const params = new URLSearchParams();
			for (const item of selectedItems) {
				params.append('items', item);
			}

			const res = await fetch(`/api/suggest?${params.toString()}`);
			if (!res.ok) throw new Error('Failed to get suggestions');

			const data = await res.json() as MealSuggestion[];
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

	function handleSaveToPlanner(suggestion: MealSuggestion) {
		plannerSuggestion = suggestion;
	}

	$effect(() => {
		if (plannerSuggestion) {
			// Navigate to planner with the suggestion data in session storage
			sessionStorage.setItem('pendingSuggestion', JSON.stringify(plannerSuggestion));
			goto('/planner');
		}
	});
</script>

<RecipeDrawer
	suggestion={drawerSuggestion}
	onClose={() => (drawerSuggestion = null)}
	onSaveToPlanner={handleSaveToPlanner}
/>

<div class="mx-auto max-w-5xl px-4 py-10 space-y-8">
	<div in:fly={{ y: 20, duration: 300 }}>
		<h1 class="h2 font-bold">✨ Get Dinner Suggestions</h1>
		<p class="text-surface-500 mt-1">
			Select the ingredients you have available and we'll suggest some great dinners
		</p>
	</div>

	<!-- Ingredient selector -->
	<div class="card preset-outlined-surface-300-700 p-6 space-y-4" in:fly={{ y: 20, delay: 80, duration: 300 }}>
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
						<span class="animate-spin mr-2">⟳</span> Finding recipes…
					{:else}
						✨ Suggest dinners ({selectedItems.size} items)
					{/if}
				</button>

				<button
					type="button"
					onclick={() => {
						if (selectedItems.size === data.pantryItems.length) {
							selectedItems = new Set();
						} else {
							selectedItems = new Set(data.pantryItems.map((i) => i.name));
						}
					}}
					class="btn preset-ghost-surface text-sm"
				>
					{selectedItems.size === data.pantryItems.length ? 'Deselect all' : 'Select all'}
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
					class="card preset-outlined-surface-300-700 h-48 overflow-hidden relative"
					in:fly={{ y: 10, delay: i * 80, duration: 250 }}
				>
					<div class="absolute inset-0 animate-shimmer"></div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Suggestions -->
	{#if suggestions.length > 0 && !isLoading}
		<div in:fly={{ y: 20, duration: 300 }}>
			<h2 class="h4 font-semibold mb-4">
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
