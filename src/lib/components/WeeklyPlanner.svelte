<script lang="ts">
	import { fly } from 'svelte/transition';
	import { DAY_LABELS } from '$lib/types';
	import type { MealPlanEntryWithRecipe } from '$lib/server/services/mealPlan';

	interface Props {
		weekStartDate: string;
		entries: MealPlanEntryWithRecipe[];
		onRemoveEntry: (entryId: string) => Promise<void>;
	}

	let { weekStartDate, entries, onRemoveEntry }: Props = $props();

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
				<span class="text-xs font-bold uppercase tracking-widest text-surface-500">{day.slice(0, 3)}</span>
				<span class="text-xs text-surface-400">{getDateForDay(i)}</span>
			</div>

			{#if entry}
				<div class="flex flex-1 flex-col gap-1">
					<p class="text-sm font-semibold leading-snug">{entry.recipe.name}</p>
					<p class="text-xs text-surface-500 line-clamp-2">{entry.recipe.description}</p>
					<div class="mt-auto flex items-center justify-between">
						<span class="text-xs text-surface-400">⏱ {entry.recipe.prepTimeMinutes}m</span>
						<button
							type="button"
							onclick={() => handleRemove(entry.entry.id)}
							disabled={removingIds.has(entry.entry.id)}
							class="text-xs text-error-500 hover:text-error-700 transition-colors"
							aria-label="Remove {entry.recipe.name} from {day}"
						>
							Remove
						</button>
					</div>
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center">
					<span class="text-xs text-surface-300-700 italic">No meal planned</span>
				</div>
			{/if}
		</div>
	{/each}
</div>
