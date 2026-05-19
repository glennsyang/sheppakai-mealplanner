<script lang="ts">
	import type { MealPlanEntryWithRecipe } from '$lib/server/services/mealPlan';
	import { DAY_LABELS } from '$lib/types';
	import { fly } from 'svelte/transition';

	interface Props {
		weekStartDate: string;
		entries: MealPlanEntryWithRecipe[];
		onRemoveEntry: (entryId: string) => Promise<void>;
		onAddCustom: (dayOfWeek: number) => void;
		onRequestVariations: (dayOfWeek: number, mealName: string) => void;
		loadingVariationsDay: number | null;
	}

	let {
		weekStartDate,
		entries,
		onRemoveEntry,
		onAddCustom,
		onRequestVariations,
		loadingVariationsDay
	}: Props = $props();

	const removingIds = $state<Set<string>>(new Set());

	function getEntryForDay(dayOfWeek: number): MealPlanEntryWithRecipe | undefined {
		return entries.find((e) => e.entry.dayOfWeek === dayOfWeek);
	}

	function getDateForDay(dayIndex: number): string {
		const monday = new Date(weekStartDate + 'T00:00:00');
		const date = new Date(monday);
		date.setDate(monday.getDate() + dayIndex);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function handleRemove(entryId: string) {
		if (removingIds.has(entryId)) return;
		removingIds.add(entryId);
		try {
			await onRemoveEntry(entryId);
		} finally {
			removingIds.delete(entryId);
		}
	}
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
	{#each DAY_LABELS as day, i}
		{@const entry = getEntryForDay(i)}
		<div
			class="card preset-outlined-surface-300-700 flex min-h-28 flex-col gap-2 p-3"
			in:fly={{ y: 10, delay: i * 50, duration: 250 }}
		>
			<div class="flex items-center justify-between">
				<span class="text-surface-500 text-xs font-bold tracking-widest uppercase"
					>{day.slice(0, 3)}</span
				>
				<span class="text-surface-400 text-xs">{getDateForDay(i)}</span>
			</div>

			{#if entry}
				<div class="flex flex-1 flex-col gap-1">
					<p class="text-sm leading-snug font-semibold">{entry.recipe.name}</p>
					<p class="text-surface-500 line-clamp-2 text-xs">{entry.recipe.description}</p>
					<div class="mt-auto flex items-center justify-between">
						{#if entry.recipe.prepTimeMinutes > 0}
							<span class="text-surface-400 text-xs">⏱ {entry.recipe.prepTimeMinutes}m</span>
						{:else}
							<span></span>
						{/if}
						<button
							type="button"
							onclick={() => handleRemove(entry.entry.id)}
							disabled={removingIds.has(entry.entry.id)}
							class="text-error-500 hover:text-error-700 text-xs transition-colors"
							aria-label="Remove {entry.recipe.name} from {day}"
						>
							Remove
						</button>
					</div>
					{#if entry.recipe.source === 'custom'}
						<button
							type="button"
							onclick={() => onRequestVariations(i, entry.recipe.name)}
							disabled={loadingVariationsDay === i}
							class="text-primary-500 hover:text-primary-700 text-left text-xs transition-colors disabled:opacity-50"
							aria-label="Get AI variations for {entry.recipe.name}"
						>
							{loadingVariationsDay === i ? 'Loading…' : '✨ Variations'}
						</button>
					{/if}
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center">
					<button
						type="button"
						onclick={() => onAddCustom(i)}
						class="btn preset-ghost-surface text-sm"
						aria-label="Add meal for {day}"
					>
						+
					</button>
				</div>
			{/if}
		</div>
	{/each}
</div>
