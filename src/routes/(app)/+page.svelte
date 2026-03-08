<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-4xl px-4 py-12 space-y-10">
	<section in:fly={{ y: 20, duration: 300 }}>
		<h1 class="h1 font-bold">
			Hello, {data.user?.name?.split(' ')[0] ?? 'there'} 👋
		</h1>
		<p class="text-surface-500 mt-2 text-lg">
			What are you cooking this week?
		</p>
	</section>

	<section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<a
			href="/pantry"
			class="card preset-outlined-surface-300-700 flex flex-col gap-3 p-6 hover:shadow-md transition-shadow text-left"
			in:fly={{ y: 20, delay: 100, duration: 300 }}
		>
			<div class="text-4xl">🥫</div>
			<div>
				<h2 class="h4 font-semibold">My Pantry</h2>
				<p class="text-surface-500 text-sm mt-1">Manage your ingredients and pantry items</p>
			</div>
		</a>

		<a
			href="/suggest"
			class="card preset-filled-primary-500 flex flex-col gap-3 p-6 hover:shadow-md transition-shadow text-left"
			in:fly={{ y: 20, delay: 150, duration: 300 }}
		>
			<div class="text-4xl">✨</div>
			<div>
				<h2 class="h4 font-semibold">Get Suggestions</h2>
				<p class="text-primary-100 text-sm mt-1">
					Let AI suggest dinners based on what you have
				</p>
			</div>
		</a>

		<a
			href="/planner"
			class="card preset-outlined-surface-300-700 flex flex-col gap-3 p-6 hover:shadow-md transition-shadow text-left"
			in:fly={{ y: 20, delay: 200, duration: 300 }}
		>
			<div class="text-4xl">📅</div>
			<div>
				<h2 class="h4 font-semibold">Weekly Planner</h2>
				<p class="text-surface-500 text-sm mt-1">Plan your dinners for the whole week</p>
			</div>
		</a>
	</section>
</div>
