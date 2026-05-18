<script lang="ts">
  import type { MealSuggestion } from '$lib/types';
  import { expoOut, linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  import SuggestionCard from './SuggestionCard.svelte';

  interface Props {
    variations: MealSuggestion[] | null;
    mealName: string;
    onClose: () => void;
    onViewRecipe: (suggestion: MealSuggestion) => void;
    onAddToPlanner: (suggestion: MealSuggestion) => void;
  }

  let { variations, mealName, onClose, onViewRecipe, onAddToPlanner }: Props = $props();

  const isOpen = $derived(variations !== null);

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && variations}
  <!-- Backdrop -->
  <div
    role="button"
    tabindex="-1"
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={() => {}}
    in:fly={{ duration: 250, easing: linear }}
    out:fly={{ duration: 200, easing: linear }}
  ></div>

  <!-- Panel -->
  <div
    class="bg-surface-50-950 fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col shadow-2xl"
    in:fly={{ x: 420, duration: 380, easing: expoOut }}
    out:fly={{ x: 420, duration: 250, easing: expoOut }}
  >
    <!-- Header -->
    <div class="border-surface-200-800 flex items-center justify-between gap-4 border-b px-6 py-5">
      <div class="space-y-0.5">
        <h2 class="font-serif text-xl leading-snug font-semibold tracking-tight">Variations</h2>
        <p class="text-surface-500 text-sm font-light">for {mealName}</p>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="text-surface-400 hover:bg-surface-100-900 hover:text-surface-950-50 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
        aria-label="Close variations panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
        >
      </button>
    </div>

    <!-- Scrollable content -->
    <div class="flex-1 space-y-4 overflow-y-auto px-6 py-6">
      {#each variations as variation, i}
        <SuggestionCard
          suggestion={variation}
          index={i}
          {onViewRecipe}
          onSaveToPlanner={onAddToPlanner}
        />
      {/each}
    </div>
  </div>
{/if}
