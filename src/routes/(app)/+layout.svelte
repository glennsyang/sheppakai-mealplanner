<script lang="ts">
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
  import { enhance } from '$app/forms';

	let { children, data } = $props();

	const user = $derived(data.user);

	let isDark = $state(false);

	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggleDark() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('color-scheme', isDark ? 'dark' : 'light');
	}

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
				<button
					type="button"
					onclick={toggleDark}
					aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					class="btn preset-ghost-surface w-9 h-9 p-0 flex items-center justify-center"
				>
					{#if isDark}
						<!-- Sun icon -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="4"/>
							<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
						</svg>
					{:else}
						<!-- Moon icon -->
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
						</svg>
					{/if}
				</button>
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
