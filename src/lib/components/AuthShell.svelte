<script lang="ts">
	import type { Snippet } from 'svelte';

	// The signed-out screens: a small board on the fridge door with the wordmark at its top.
	let { children }: { children: Snippet } = $props();
</script>

<div class="flex min-h-dvh flex-col items-center justify-center px-0 py-0 sm:px-6 sm:py-12">
	<div class="board w-full max-w-md flex-1 px-6 pt-10 pb-10 sm:flex-none sm:px-10 sm:pt-12">
		<p class="mb-10 flex items-center gap-2">
			<span class="magnet" aria-hidden="true"></span>
			<span class="marker text-[1.5rem] leading-none font-bold tracking-tight">Meal Planner</span>
		</p>
		<div class="space-y-7">
			{@render children()}
		</div>
	</div>
</div>
