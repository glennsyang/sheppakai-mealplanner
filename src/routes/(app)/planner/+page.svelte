<script lang="ts">
	import { fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import WeeklyPlanner from '$lib/components/WeeklyPlanner.svelte';
	import { DAY_LABELS } from '$lib/types';
	import type { MealSuggestion } from '$lib/types';
	import type { PageData } from './$types';
	import type { MealPlanEntryWithRecipe } from '$lib/server/services/mealPlan';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let entries = $state<MealPlanEntryWithRecipe[]>([]);
	let pendingSuggestion = $state<MealSuggestion | null>(null);
	let selectedDay = $state<number>(0);
	let showDayPicker = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		entries = data.entries;
	});

	onMount(() => {
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

	async function handleRemoveEntry(entryId: string): Promise<void> {
		const formData = new FormData();
		formData.set('entryId', entryId);

		const res = await fetch('?/remove', {
			method: 'POST',
			body: formData
		});

		if (res.ok) {
			entries = entries.filter((e) => e.entry.id !== entryId);
		}
	}

	function getWeekLabel(weekStartDate: string): string {
		const monday = new Date(weekStartDate + 'T00:00:00');
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${fmt(monday)} – ${fmt(sunday)}`;
	}

	function navigateWeek(offset: number): string {
		const current = new Date(data.weekStartDate + 'T00:00:00');
		current.setDate(current.getDate() + offset * 7);
		return '?week=' + current.toISOString().split('T')[0];
	}
</script>

<!-- Day picker modal for pending suggestion -->
{#if showDayPicker && pendingSuggestion}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Add to planner"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		onclick={(e) => { if (e.target === e.currentTarget) { showDayPicker = false; pendingSuggestion = null; } }}
		onkeydown={(e) => { if (e.key === 'Escape') { showDayPicker = false; pendingSuggestion = null; } }}
		in:fly={{ duration: 200 }}
	>
		<div
			class="card preset-filled-surface-50-950 w-full max-w-sm p-6 space-y-5 shadow-2xl"
			in:fly={{ y: 20, duration: 250 }}
		>
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
							showDayPicker = false;
							pendingSuggestion = null;
							await update();
						}
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="weekStartDate" value={data.weekStartDate} />
				<input type="hidden" name="name" value={pendingSuggestion.name} />
				<input type="hidden" name="description" value={pendingSuggestion.description} />
				<input type="hidden" name="ingredientsJson" value={JSON.stringify(pendingSuggestion.ingredients)} />
				<input type="hidden" name="instructionsJson" value={JSON.stringify(pendingSuggestion.steps)} />
				<input type="hidden" name="prepTimeMinutes" value={pendingSuggestion.prepTimeMinutes} />
				<input type="hidden" name="servings" value={pendingSuggestion.servings} />


				<div class="grid grid-cols-2 gap-2">
					{#each DAY_LABELS as day, i}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="dayOfWeek"
								value={i}
								bind:group={selectedDay}
								class="radio"
							/>
							<span class="text-sm">{day}</span>
						</label>
					{/each}
				</div>

				<div class="flex gap-2">
					<button
						type="submit"
						disabled={isSubmitting}
						class="btn preset-filled-primary-500 flex-1"
					>
						{isSubmitting ? 'Saving…' : 'Add to planner'}
					</button>
					<button
						type="button"
						onclick={() => { showDayPicker = false; pendingSuggestion = null; }}
						class="btn preset-ghost-surface"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="mx-auto max-w-6xl px-4 py-10 space-y-8">
	<div class="flex items-center justify-between flex-wrap gap-4" in:fly={{ y: 20, duration: 300 }}>
		<div>
			<h1 class="h2 font-bold">📅 Weekly Planner</h1>
			<p class="text-surface-500 mt-1">Plan your dinners for the week</p>
		</div>

		<div class="flex items-center gap-2">
			<a href={navigateWeek(-1)} class="btn preset-ghost-surface text-sm">← Prev</a>
			<span class="text-sm font-medium px-2">{getWeekLabel(data.weekStartDate)}</span>
			<a href={navigateWeek(1)} class="btn preset-ghost-surface text-sm">Next →</a>
		</div>
	</div>

	<div in:fly={{ y: 20, delay: 100, duration: 300 }}>
		<WeeklyPlanner
			weekStartDate={data.weekStartDate}
			{entries}
			onRemoveEntry={handleRemoveEntry}
		/>
	</div>

	<div in:fly={{ y: 10, delay: 200, duration: 250 }}>
		<a href="/suggest" class="btn preset-filled-primary-500">
			✨ Get more suggestions
		</a>
	</div>
</div>
