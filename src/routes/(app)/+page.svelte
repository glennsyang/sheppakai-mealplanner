<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import RecipeDrawer from '$lib/components/RecipeDrawer.svelte';
	import WeeklyPlanner from '$lib/components/WeeklyPlanner.svelte';
	import { recipeAsSuggestion } from '$lib/recipes';
	import { trackToday } from '$lib/today.svelte';
	import { DAY_LABELS } from '$lib/types';
	import type { MealPlanEntryWithRecipe } from '$lib/types';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const today = trackToday(
		() => data.weekStartDate,
		() => data.todayIndex
	);

	const tonight = $derived(
		today.index === null ? undefined : data.entries.find((e) => e.entry.dayOfWeek === today.index)
	);
	const openNights = $derived(DAY_LABELS.length - data.entries.length);

	const todayLabel = $derived.by(() => {
		if (today.index === null) return '';
		const date = new Date(data.weekStartDate + 'T00:00:00');
		date.setDate(date.getDate() + today.index);
		return `${DAY_LABELS[today.index]}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
	});

	const weekLabel = $derived.by(() => {
		const monday = new Date(data.weekStartDate + 'T00:00:00');
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${fmt(monday)} – ${fmt(sunday)}`;
	});

	// Tracked by id so the drawer picks up the saved recipe after an edit reloads the data.
	let openEntryId = $state<string | null>(null);
	const openEntry = $derived(data.entries.find((e) => e.entry.id === openEntryId) ?? null);
	const drawerSuggestion = $derived(openEntry ? recipeAsSuggestion(openEntry.recipe) : null);

	function openRecipe(entry: MealPlanEntryWithRecipe) {
		openEntryId = entry.entry.id;
	}
</script>

<svelte:head>
	<title>Tonight — Meal Planner</title>
</svelte:head>

<RecipeDrawer
	suggestion={drawerSuggestion}
	onClose={() => (openEntryId = null)}
	recipeId={openEntry?.recipe.id}
	onSaved={invalidateAll}
/>

<!-- Tonight: the answer to "what's for dinner?" before anything else -->
<section class="px-5 pt-8 pb-10 sm:px-10 sm:pt-12 sm:pb-14" aria-labelledby="tonight-heading">
	{#if tonight}
		<h1
			id="tonight-heading"
			class="max-w-[18ch] text-[2.5rem] leading-[1.05] font-bold tracking-[-0.025em] sm:text-[3.75rem]"
		>
			<span class="marker ink-red">Tonight,</span>
			{tonight.recipe.name}
		</h1>
		{#if tonight.recipe.description}
			<p class="ink-soft mt-4 max-w-[58ch] text-lg leading-relaxed">
				{tonight.recipe.description}
			</p>
		{/if}
		<div class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
			<button type="button" class="btn act px-6 py-3 text-lg" onclick={() => openRecipe(tonight)}>
				<Icon name="book" size={20} />
				Open recipe
			</button>
			{#if tonight.recipe.prepTimeMinutes > 0}
				<span class="ink-soft tabular inline-flex items-center gap-2 font-semibold">
					<Icon name="clock" />{tonight.recipe.prepTimeMinutes} min
				</span>
			{/if}
		</div>
	{:else}
		<h1
			id="tonight-heading"
			class="max-w-[20ch] text-[2.25rem] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[3.25rem]"
		>
			Nothing's on the board <span class="marker ink-red whitespace-nowrap">tonight.</span>
		</h1>
		<p class="ink-soft mt-4 max-w-[52ch] text-lg leading-relaxed">
			<span class="font-semibold">{todayLabel}.</span>
			{#if data.pantryCount > 0}
				{data.pantryCount === 1
					? "There's 1 ingredient on the fridge."
					: `There are ${data.pantryCount} ingredients on the fridge.`} Get a few dinner ideas from what's
				there, or write something in yourself.
			{:else}
				Add what's in the kitchen to the pantry and you'll get dinner ideas from it.
			{/if}
		</p>
		<div class="mt-7 flex flex-wrap items-center gap-3">
			{#if data.pantryCount > 0}
				<a href="/suggest" class="btn act px-6 py-3 text-lg">
					<Icon name="sparkles" size={20} />
					Suggest dinners
				</a>
			{:else}
				<a href="/pantry" class="btn act px-6 py-3 text-lg">
					<Icon name="basket" size={20} />
					Fill the pantry
				</a>
			{/if}
			<a href="/planner" class="btn act-quiet px-5 py-3 text-lg">
				<Icon name="pencil" size={18} />
				Write one in
			</a>
		</div>
	{/if}
</section>

<!-- The week at a glance -->
<section class="week-band px-3 pt-6 pb-8 sm:px-8 sm:pb-10" aria-labelledby="week-heading">
	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-2">
		<h2 id="week-heading" class="text-xl font-bold tracking-tight">
			This week
			<span class="ink-soft tabular ml-2 text-base font-semibold">{weekLabel}</span>
		</h2>
		<a href="/planner" class="act-text ink-blue inline-flex items-center gap-1.5">
			{openNights === 0
				? 'Edit the week'
				: `${openNights} night${openNights === 1 ? '' : 's'} open`}
			<Icon name="arrow" size={16} />
		</a>
	</div>
	<WeeklyPlanner
		weekStartDate={data.weekStartDate}
		entries={data.entries}
		todayIndex={today.index}
		onOpenRecipe={openRecipe}
	/>
</section>

<style>
	.week-band {
		border-top: 1px solid var(--rule-strong);
	}
</style>
