<script lang="ts">
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const firstName = $derived(data.user?.name?.split(' ')[0] ?? 'there');
</script>

<svelte:head>
	<title>Home — MealPlanner</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-12 px-6 py-14">
	<!-- Greeting -->
	<section in:fly={{ y: 24, duration: 500, easing: expoOut }}>
		<p class="text-primary-600 mb-3 text-sm font-medium tracking-widest uppercase">Your kitchen</p>
		<h1 class="h1 text-4xl leading-tight font-semibold">
			Hello, {firstName}.
		</h1>
		<p class="text-surface-500 mt-3 text-lg leading-relaxed font-light">
			What are you cooking this week?
		</p>
	</section>

	<!-- Editorial card grid: feature (3/5) + secondary stacked (2/5) -->
	<section class="grid grid-cols-1 gap-4 sm:grid-cols-5">
		<!-- Feature card: AI suggestions -->
		<a
			href="/suggest"
			class="card preset-filled-primary-500 card-lift flex min-h-55 flex-col justify-between gap-8 p-8 sm:col-span-3"
			in:fly={{ y: 24, delay: 80, duration: 500, easing: expoOut }}
		>
			<div>
				<p class="text-primary-100 mb-3 text-xs font-medium tracking-widest uppercase">
					AI-powered
				</p>
				<h2 class="font-serif text-2xl leading-snug font-semibold tracking-tight">
					Discover tonight's<br />dinner
				</h2>
				<p class="text-primary-100 mt-3 text-sm leading-relaxed font-light">
					Tell us what's in your pantry — MealPlanner suggests dinners and full recipes.
				</p>
			</div>
			<div class="flex items-center gap-2 text-sm font-medium">
				Get suggestions
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
				>
			</div>
		</a>

		<!-- Secondary cards stacked -->
		<div class="flex flex-col gap-4 sm:col-span-2">
			<a
				href="/pantry"
				class="card preset-outlined-surface-300-700 card-lift flex flex-1 flex-col gap-2 p-6"
				in:fly={{ y: 24, delay: 140, duration: 500, easing: expoOut }}
			>
				<p class="text-surface-400 text-xs font-medium tracking-widest uppercase">Ingredients</p>
				<h2 class="font-serif text-xl leading-tight font-semibold tracking-tight">My Pantry</h2>
				<p class="text-surface-500 mt-1 text-sm leading-relaxed font-light">
					Manage your ingredients
				</p>
			</a>

			<a
				href="/planner"
				class="card preset-outlined-surface-300-700 card-lift flex flex-1 flex-col gap-2 p-6"
				in:fly={{ y: 24, delay: 200, duration: 500, easing: expoOut }}
			>
				<p class="text-surface-400 text-xs font-medium tracking-widest uppercase">Schedule</p>
				<h2 class="font-serif text-xl leading-tight font-semibold tracking-tight">
					Weekly Planner
				</h2>
				<p class="text-surface-500 mt-1 text-sm leading-relaxed font-light">
					Plan your dinners, Mon–Sun
				</p>
			</a>
		</div>
	</section>
</div>
