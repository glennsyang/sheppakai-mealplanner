<script lang="ts">
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
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
		{ href: '/', label: 'Dashboard' },
		{ href: '/pantry', label: 'Pantry' },
		{ href: '/suggest', label: 'Suggest' },
		{ href: '/planner', label: 'Planner' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	const userInitial = $derived(user?.name?.[0]?.toUpperCase() ?? '?');
</script>

<div class="flex min-h-dvh flex-col">
	<!-- Header -->
	<header class="sticky top-0 z-30 border-b border-surface-200-800 bg-surface-50-950/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
			<!-- Wordmark -->
			<a href="/" class="flex items-center gap-0 shrink-0" aria-label="Meal Planner home">
				<span class="font-serif text-xl font-semibold tracking-tight text-surface-950-50">Meal</span>
				<span class="font-serif text-xl font-semibold tracking-tight italic text-primary-600">&nbsp;Planner</span>
			</a>

			<!-- Primary nav -->
			<nav class="flex items-center gap-6 ml-4" aria-label="Main navigation">
				{#each navLinks as link}
					<a
						href={link.href}
						class="relative text-sm py-0.5 transition-colors duration-150"
						class:nav-active={isActive(link.href)}
						class:text-surface-950-50={isActive(link.href)}
						class:text-surface-500={!isActive(link.href)}
						class:hover:text-surface-950-50={!isActive(link.href)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Right side -->
			<div class="ml-auto flex items-center gap-3">
				<!-- Dark mode toggle -->
				<button
					type="button"
					onclick={toggleDark}
					aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					class="flex size-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100-900 hover:text-surface-950-50"
				>
					{#if isDark}
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="12" cy="12" r="4"/>
							<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
						</svg>
					{/if}
				</button>

				<!-- User avatar -->
				<div
					class="flex size-8 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white select-none shrink-0"
					title={user?.name ?? ''}
					aria-label={user?.name ?? 'User'}
				>
					{userInitial}
				</div>

				<!-- Sign out -->
				<form method="POST" action="/logout" use:enhance id="logout-form"></form>
				<button
					type="button"
					onclick={() => {
						const form = document.getElementById('logout-form') as HTMLFormElement;
						form?.requestSubmit();
					}}
					class="text-sm text-surface-500 transition-colors hover:text-surface-950-50"
				>
					Sign out
				</button>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1" in:fly={{ y: 12, duration: 400, easing: expoOut }}>
		{@render children()}
	</main>
</div>
