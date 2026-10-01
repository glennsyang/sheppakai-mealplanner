<script lang="ts">
	import { enhance } from '$app/forms';
	import { actionFailureText } from '$lib/action-result';
	import Icon from '$lib/components/Icon.svelte';
	import TodayRing from '$lib/components/TodayRing.svelte';
	import { DAY_LABELS } from '$lib/types';
	import type { MealPlanEntryWithRecipe } from '$lib/types';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface PlannerActions {
		/** Called after the `?/remove` action succeeds. */
		onEntryRemoved: (entryId: string) => void;
		/** Called with the server's message (or a fallback) when `?/remove` fails. */
		onRemoveFailed: (text: string) => void;
		onAddCustom: (dayOfWeek: number) => void;
		onRequestVariations: (dayOfWeek: number, mealName: string) => void;
		loadingVariationsDay: number | null;
	}

	interface Props {
		weekStartDate: string;
		entries: MealPlanEntryWithRecipe[];
		/** Mon=0 … Sun=6 when this board is the current week, otherwise null. */
		todayIndex: number | null;
		onOpenRecipe: (entry: MealPlanEntryWithRecipe) => void;
		/** The day a meal was just stuck onto; its row plays the placement motion. */
		stuckDay?: number | null;
		/** Editing controls; omitted for the read-only board on the Tonight screen. */
		actions?: PlannerActions;
	}

	let {
		weekStartDate,
		entries,
		todayIndex,
		onOpenRecipe,
		stuckDay = null,
		actions
	}: Props = $props();

	const removingIds = $state<Set<string>>(new Set());

	const entriesByDay = $derived(new Map(entries.map((e) => [e.entry.dayOfWeek, e])));

	function getDateForDay(dayIndex: number): string {
		const monday = new Date(weekStartDate + 'T00:00:00');
		const date = new Date(monday);
		date.setDate(monday.getDate() + dayIndex);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Remove goes through a real form + use:enhance so SvelteKit sends it as an
	// action request and hands back a typed ActionResult (#167).
	function removeEnhance(entryId: string): SubmitFunction {
		return ({ cancel }) => {
			if (removingIds.has(entryId)) return cancel();
			removingIds.add(entryId);
			return async ({ result }) => {
				removingIds.delete(entryId);
				if (result.type === 'success') {
					actions?.onEntryRemoved(entryId);
				} else {
					actions?.onRemoveFailed(
						actionFailureText(result, 'Could not erase that meal. Please try again.')
					);
				}
			};
		};
	}
</script>

<ol class="week ruled" aria-label="Dinners for the week">
	{#each DAY_LABELS as day, i (day)}
		{@const entry = entriesByDay.get(i)}
		{@const isToday = todayIndex === i}
		{@const isPast = todayIndex !== null && i < todayIndex}
		<li
			class="day"
			class:day-past={isPast}
			class:animate-stick={stuckDay === i && entry}
			aria-current={isToday ? 'date' : undefined}
		>
			{#if isToday}
				<TodayRing />
			{/if}

			<div class="day-label">
				<span class="marker text-lg leading-none sm:text-xl" class:ink-red={isToday}>
					<span class="sm:hidden">{day.slice(0, 3)}</span><span class="hidden sm:inline">{day}</span
					>
				</span>
				<span class="ink-soft tabular mt-1 block text-xs">{getDateForDay(i)}</span>
			</div>

			{#if entry}
				<div class="min-w-0">
					<button
						type="button"
						class="dish text-left"
						onclick={() => onOpenRecipe(entry)}
						aria-label="Open the recipe for {entry.recipe.name}"
					>
						{entry.recipe.name}
					</button>
					{#if entry.recipe.description}
						<p class="ink-soft mt-0.5 line-clamp-1 text-sm">{entry.recipe.description}</p>
					{/if}
				</div>

				<span class="prep tabular ink-soft text-sm">
					{#if entry.recipe.prepTimeMinutes > 0}{entry.recipe.prepTimeMinutes} min{/if}
				</span>

				{#if actions}
					<div class="day-actions">
						{#if entry.recipe.source === 'custom'}
							<button
								type="button"
								onclick={() => actions.onRequestVariations(i, entry.recipe.name)}
								disabled={actions.loadingVariationsDay === i}
								class="row-btn ink-green"
								aria-label="Get AI variations for {entry.recipe.name}"
								title="Variations"
							>
								<Icon
									name={actions.loadingVariationsDay === i ? 'loader' : 'shuffle'}
									class={actions.loadingVariationsDay === i ? 'animate-spin' : ''}
								/>
							</button>
						{/if}
						<form method="POST" action="?/remove" use:enhance={removeEnhance(entry.entry.id)}>
							<input type="hidden" name="entryId" value={entry.entry.id} />
							<button
								type="submit"
								disabled={removingIds.has(entry.entry.id)}
								class="row-btn erase"
								aria-label="Erase {entry.recipe.name} from {day}"
								title="Erase"
							>
								<Icon name="eraser" />
							</button>
						</form>
					</div>
				{/if}
			{:else}
				<div class="col-span-3 flex min-w-0 items-center gap-3">
					{#if actions}
						<button
							type="button"
							onclick={() => actions.onAddCustom(i)}
							class="ghost"
							aria-label="Write in a meal for {day}"
						>
							<Icon name="pencil" size={16} />
							<span>write one in</span>
						</button>
					{:else}
						<a href="/planner" class="ghost" aria-label="Write in a meal for {day}">
							<Icon name="pencil" size={16} />
							<span>write one in</span>
						</a>
					{/if}
				</div>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.week {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Printed planner row: day column | dish | minutes | actions */
	.day {
		position: relative;
		display: grid;
		grid-template-columns: 3.25rem minmax(0, 1fr) auto auto;
		align-items: center;
		column-gap: 0.875rem;
		min-height: 4.25rem;
		padding: 0.75rem 0.25rem;
	}
	@media (min-width: 640px) {
		.day {
			grid-template-columns: 8.5rem minmax(0, 1fr) 4.5rem auto;
			column-gap: 1.25rem;
			min-height: 4.75rem;
			padding-inline: 0.5rem;
		}
	}

	.day-label {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-right: 0.5rem;
		border-right: 1px solid var(--rule);
	}

	.day-past .dish,
	.day-past .day-label,
	.day-past .prep {
		opacity: 0.5;
	}

	.dish {
		display: block;
		max-width: 100%;
		font-size: 1.075rem;
		line-height: 1.3;
		font-weight: 700;
		color: var(--ink);
		text-decoration: underline;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 0.2em;
		text-decoration-color: transparent;
		transition: text-decoration-color 120ms;
	}
	.dish:hover {
		text-decoration-color: var(--marker-blue);
	}
	@media (min-width: 640px) {
		.dish {
			font-size: 1.2rem;
		}
	}

	.prep {
		text-align: right;
		white-space: nowrap;
	}

	.day-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.row-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 8px;
		transition: background-color 120ms;
	}
	.row-btn:hover:not(:disabled) {
		background: color-mix(in oklch, var(--ink) 7%, transparent);
	}
	.row-btn:disabled {
		opacity: 0.5;
	}
	.erase {
		color: var(--ink-faint);
	}
	.erase:hover:not(:disabled) {
		color: var(--marker-red);
	}

	/* Empty slot: a faint invitation written on the line */
	.ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		padding-inline: 0.25rem;
		font-family: var(--font-marker);
		font-weight: 500;
		color: var(--ink-faint);
		border-radius: 8px;
		transition: color 120ms;
	}
	.ghost:hover {
		color: var(--marker-blue);
	}
</style>
