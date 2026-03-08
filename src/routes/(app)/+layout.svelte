<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
  import { enhance } from '$app/forms';

	let { children, data } = $props();

	const user = $derived(data.user);

	const navLinks = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/pantry', label: 'Pantry', icon: '🥫' },
		{ href: '/suggest', label: 'Suggest', icon: '✨' },
		{ href: '/planner', label: 'Planner', icon: '📅' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- App Bar -->
	<header class="sticky top-0 z-30 border-b border-surface-200-800 bg-surface-50-950/95 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
			<a href="/" class="flex items-center gap-2 font-bold text-lg">
				<span class="text-2xl">🍽</span>
				<span class="text-primary-600">Meal Planner</span>
			</a>

			<nav class="flex gap-1 ml-4" aria-label="Main navigation">
				{#each navLinks as link}
					<a
						href={link.href}
						class="btn text-sm px-3 py-1.5 rounded-md transition-colors"
						class:preset-tonal-primary={isActive(link.href)}
						class:preset-ghost-surface={!isActive(link.href)}
					>
						{link.icon} {link.label}
					</a>
				{/each}
			</nav>

			<div class="ml-auto flex items-center gap-3">
				<span class="text-sm text-surface-500 hidden sm:block">{user?.name}</span>
				<form method="POST" action="/logout" use:enhance id="logout-form"></form>
				<button
					type="button"
					onclick={() => {
						const form = document.getElementById('logout-form') as HTMLFormElement;
						form?.requestSubmit();
					}}
					class="btn preset-ghost-surface text-sm"
				>
					Sign out
				</button>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1" in:fly={{ y: 10, duration: 250 }}>
		{@render children()}
	</main>
</div>
