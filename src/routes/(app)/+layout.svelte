<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

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
	<header
		class="border-surface-200-800 bg-surface-50-950/95 sticky top-0 z-30 border-b backdrop-blur-sm"
	>
		<div class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
			<!-- Wordmark -->
			<a href="/" class="flex shrink-0 items-center gap-0" aria-label="Meal Planner home">
				<span class="text-surface-950-50 font-serif text-xl font-semibold tracking-tight">Meal</span
				>
				<span class="text-primary-600 font-serif text-xl font-semibold tracking-tight italic"
					>&nbsp;Planner</span
				>
			</a>

			<!-- Primary nav -->
			<nav class="ml-4 flex items-center gap-6" aria-label="Main navigation">
				{#each navLinks as link}
					<a
						href={link.href}
						class="relative py-0.5 text-sm transition-colors duration-150"
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
					class="text-surface-500 hover:bg-surface-100-900 hover:text-surface-950-50 flex size-8 items-center justify-center rounded-full transition-colors"
				>
					{#if isDark}
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
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="4" />
							<path
								d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
							/>
						</svg>
					{:else}
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
							aria-hidden="true"
						>
							<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
						</svg>
					{/if}
				</button>

				<!-- User avatar -->
				<div
					class="bg-primary-500 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white select-none"
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
					class="text-surface-500 hover:text-surface-950-50 text-sm transition-colors"
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
