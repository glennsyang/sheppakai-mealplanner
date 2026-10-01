<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthFormMessage from '$lib/components/AuthFormMessage.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { addPantryItemSchema } from '$lib/schemas/pantry';
	import { magnetTilt } from '$lib/tilt';
	import { autoAnimate } from '@formkit/auto-animate';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const items = $derived(data.items);

	// svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
	const {
		form,
		errors,
		constraints,
		message,
		enhance: sfEnhance,
		submitting
	} = superForm(data.addForm, {
		validators: zod4Client(addPantryItemSchema),
		resetForm: true
	});

	let removeError = $state<string | null>(null);
</script>

<svelte:head>
	<title>Pantry — Meal Planner</title>
</svelte:head>

<div class="px-5 pt-8 pb-8 sm:px-10 sm:pt-12">
	<h1 class="text-[2rem] leading-tight font-bold tracking-tight sm:text-[2.5rem]">Pantry</h1>
	<p class="ink-soft mt-2 max-w-[56ch] text-lg leading-relaxed">
		What's in the kitchen. Dinner ideas are built from these.
	</p>

	<form method="POST" action="?/add" use:sfEnhance class="add mt-8">
		<AuthFormMessage message={$message} />
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto] sm:items-end">
			<label class="label col-span-2 sm:col-span-1">
				<span class="font-semibold">Ingredient</span>
				<input
					type="text"
					name="name"
					bind:value={$form.name}
					class="input text-lg"
					class:input-error={$errors.name}
					{...$constraints.name}
					placeholder="Chicken thighs"
				/>
			</label>
			<label class="label">
				<span class="font-semibold">Amount</span>
				<input
					type="number"
					name="quantity"
					bind:value={$form.quantity}
					class="input tabular text-lg"
					min="0"
					step="any"
					placeholder="2"
				/>
			</label>
			<label class="label">
				<span class="font-semibold">Unit</span>
				<input
					type="text"
					name="unit"
					bind:value={$form.unit}
					class="input text-lg"
					placeholder="lb"
				/>
			</label>
			<button type="submit" disabled={$submitting} class="btn act col-span-2 py-3 sm:col-span-1">
				<Icon name="plus" />
				{$submitting ? 'Adding…' : 'Add'}
			</button>
		</div>
		{#if $errors.name}
			<p class="ink-red mt-2 text-sm">{$errors.name}</p>
		{/if}
	</form>
</div>

<section class="fridge px-5 pt-7 pb-10 sm:px-10" aria-labelledby="items-heading">
	<h2 id="items-heading" class="mb-6 flex items-baseline gap-3">
		<span class="text-xl font-bold tracking-tight">On the fridge</span>
		<span class="marker ink-blue tabular text-lg">{items.length}</span>
	</h2>

	{#if removeError}
		<div class="alert preset-tonal-error mb-5" role="alert">{removeError}</div>
	{/if}

	{#if items.length === 0}
		<p class="marker ink-faint text-xl">The fridge is bare. Add the first ingredient above.</p>
	{:else}
		<ul class="flex flex-wrap gap-x-2.5 gap-y-3" use:autoAnimate>
			{#each items as item (item.id)}
				<li
					class="tile flex items-center gap-2 py-1 pr-1 pl-3"
					style="--tilt: {magnetTilt(item.name)}deg"
				>
					<span class="text-[1.05rem] font-semibold">{item.name}</span>
					{#if item.quantity}
						<span class="ink-soft tabular text-sm">
							{item.quantity}{item.unit ? ` ${item.unit}` : ''}
						</span>
					{/if}
					<form
						method="POST"
						action="?/remove"
						use:enhance={() =>
							async ({ result, update }) => {
								removeError =
									result.type === 'success'
										? null
										: `Could not remove ${item.name}. Please try again.`;
								await update();
							}}
					>
						<input type="hidden" name="id" value={item.id} />
						<button type="submit" class="take-off" aria-label="Remove {item.name}">
							<Icon name="x" size={16} />
						</button>
					</form>
				</li>
			{/each}
		</ul>

		<a href="/suggest" class="btn act mt-10 px-5 py-2.5">
			<Icon name="sparkles" />
			Get dinner ideas
		</a>
	{/if}
</section>

<style>
	.fridge {
		border-top: 1px solid var(--rule-strong);
	}
	.take-off {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 2px;
		color: var(--ink-faint);
	}
	.take-off:hover {
		color: var(--marker-red);
		background: color-mix(in oklch, var(--marker-red) 10%, transparent);
	}
</style>
