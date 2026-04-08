<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addPantryItemSchema } from '$lib/schemas/pantry';
	import { fly } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { autoAnimate } from '@formkit/auto-animate';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const items = $derived(data.items);

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const { form, errors, constraints, enhance: sfEnhance, submitting } = superForm(data.addForm, {
		validators: zod4Client(addPantryItemSchema),
		resetForm: true,
		onUpdated({ form: f }) {
			if (f.valid) {
				// items are refreshed via invalidation
			}
		}
	});
</script>

<svelte:head>
	<title>Pantry — MealPlanner</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10 space-y-8">
	<div in:fly={{ y: 20, duration: 300 }}>
		<h1 class="h2 font-bold">My Pantry</h1>
		<p class="text-surface-500 mt-1">Track what you have available for cooking</p>
	</div>

	<!-- Add item form -->
	<div class="card preset-outlined-surface-300-700 p-6 space-y-4" in:fly={{ y: 20, delay: 80, duration: 300 }}>
		<h2 class="h5 font-semibold">Add an ingredient</h2>
		<form method="POST" action="?/add" use:sfEnhance class="space-y-3">
			<label class="label">
				<span class="label-text">Ingredient name *</span>
				<input
					type="text"
					name="name"
					bind:value={$form.name}
					class="input"
					class:input-error={$errors.name}
					{...$constraints.name}
					placeholder="e.g. Chicken breast"
				/>
				{#if $errors.name}
					<span class="text-error-500 text-xs">{$errors.name}</span>
				{/if}
			</label>

			<div class="grid grid-cols-2 gap-3">
				<label class="label">
					<span class="label-text">Quantity (optional)</span>
					<input
						type="number"
						name="quantity"
						bind:value={$form.quantity}
						class="input"
						min="0"
						step="any"
						placeholder="e.g. 2"
					/>
				</label>
				<label class="label">
					<span class="label-text">Unit (optional)</span>
					<input
						type="text"
						name="unit"
						bind:value={$form.unit}
						class="input"
						placeholder="e.g. cups"
					/>
				</label>
			</div>

			<button
				type="submit"
				disabled={$submitting}
				class="btn preset-filled-primary-500"
			>
				{$submitting ? 'Adding…' : 'Add to pantry'}
			</button>
		</form>
	</div>

	<!-- Items list -->
	<div in:fly={{ y: 20, delay: 160, duration: 300 }}>
		<h2 class="h5 font-semibold mb-3">
			Your items
			<span class="badge preset-tonal-surface ml-2">{items.length}</span>
		</h2>

		{#if items.length === 0}
			<div class="card preset-outlined-surface-200-800 p-8 text-center text-surface-400">
				<p class="text-4xl mb-3">🥫</p>
				<p>Your pantry is empty. Add some ingredients above!</p>
			</div>
		{:else}
			<div class="space-y-2" use:autoAnimate>
				{#each items as item (item.id)}
					<div class="card preset-outlined-surface-200-800 flex items-center justify-between px-4 py-3">
						<div>
							<span class="font-medium">{item.name}</span>
							{#if item.quantity}
								<span class="text-surface-500 text-sm ml-2">
									{item.quantity}{item.unit ? ` ${item.unit}` : ''}
								</span>
							{/if}
						</div>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button
								type="submit"
								class="btn preset-ghost-error text-sm px-2 py-1"
								aria-label="Remove {item.name}"
							>
								Remove
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if items.length > 0}
		<div in:fly={{ y: 10, delay: 200, duration: 250 }}>
			<a
				href="/suggest"
				class="btn preset-filled-primary-500"
			>
				✨ Get dinner suggestions
			</a>
		</div>
	{/if}
</div>
