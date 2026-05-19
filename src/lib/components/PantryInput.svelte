<script lang="ts">
	import type { PantryItem } from '$lib/types';
	import { autoAnimate } from '@formkit/auto-animate';

	interface Props {
		items: PantryItem[];
		onAdd: (name: string) => Promise<void>;
		onRemove: (id: string) => Promise<void>;
	}

	let { items, onAdd, onRemove }: Props = $props();

	let inputValue = $state('');
	let isAdding = $state(false);
	let removingIds = $state<Set<string>>(new Set());

	async function handleAdd() {
		const name = inputValue.trim();
		if (!name || isAdding) return;

		isAdding = true;
		try {
			await onAdd(name);
			inputValue = '';
		} finally {
			isAdding = false;
		}
	}

	async function handleRemove(id: string) {
		if (removingIds.has(id)) return;
		removingIds = new Set([...removingIds, id]);
		try {
			await onRemove(id);
		} finally {
			removingIds = new Set([...removingIds].filter((x) => x !== id));
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd();
		}
	}
</script>

<div class="space-y-4">
	<div class="flex gap-2">
		<input
			type="text"
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Add an ingredient (e.g. chicken breast)…"
			class="input flex-1"
			disabled={isAdding}
		/>
		<button
			type="button"
			onclick={handleAdd}
			disabled={!inputValue.trim() || isAdding}
			class="btn preset-filled-primary-500"
		>
			{isAdding ? 'Adding…' : 'Add'}
		</button>
	</div>

	{#if items.length === 0}
		<p class="text-surface-400 text-sm italic">No items in pantry yet. Add some above!</p>
	{:else}
		<div class="flex flex-wrap gap-2" use:autoAnimate>
			{#each items as item (item.id)}
				<span
					class="chip preset-tonal-primary flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
				>
					{item.name}
					{#if item.quantity}
						<span class="text-xs opacity-70"
							>({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span
						>
					{/if}
					<button
						type="button"
						onclick={() => handleRemove(item.id)}
						disabled={removingIds.has(item.id)}
						aria-label="Remove {item.name}"
						class="ml-1 rounded-full text-xs opacity-60 transition-opacity hover:opacity-100"
					>
						✕
					</button>
				</span>
			{/each}
		</div>
	{/if}
</div>
