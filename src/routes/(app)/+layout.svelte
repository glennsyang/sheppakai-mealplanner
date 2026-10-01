<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { SIGN_OUT_ROUTE } from '$lib/auth-routes';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const user = $derived(data.user);
	const isDark = $derived(mode.current === 'dark');
	const isAdmin = $derived(user?.role === 'admin');

	const navLinks: { href: string; label: string; icon: IconName }[] = [
		{ href: '/', label: 'Tonight', icon: 'home' },
		{ href: '/planner', label: 'Week', icon: 'calendar' },
		{ href: '/suggest', label: 'Suggest', icon: 'sparkles' },
		{ href: '/pantry', label: 'Pantry', icon: 'basket' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	let logoutForm = $state<HTMLFormElement>();

	function signOut() {
		logoutForm?.requestSubmit();
	}

	const userInitial = $derived(user?.name?.[0]?.toUpperCase() ?? '?');
</script>

<form method="POST" action={SIGN_OUT_ROUTE} use:enhance bind:this={logoutForm} hidden></form>

<div class="flex min-h-dvh flex-col">
	<!-- Top of the fridge door: wordmark, the marker tray (desktop), owner controls -->
	<header
		class="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-6"
	>
		<a href="/" class="group flex shrink-0 items-center gap-2" aria-label="Meal Planner, tonight">
			<span class="magnet" aria-hidden="true"></span>
			<span class="marker text-[1.35rem] leading-none font-bold tracking-tight">Meal Planner</span>
		</a>

		<div class="ml-auto flex items-center gap-1.5">
			{#if isAdmin}
				<a
					href="/admin"
					class="door-btn door-admin"
					aria-label="Admin"
					aria-current={isActive('/admin') ? 'page' : undefined}
				>
					<Icon name="shield" />
				</a>
			{/if}
			<button
				type="button"
				onclick={toggleMode}
				aria-label={isDark ? 'Switch to the white board' : 'Switch to the black glass board'}
				class="door-btn"
			>
				<Icon name={isDark ? 'sun' : 'moon'} />
			</button>
			<a
				href="/profile"
				class="avatar"
				class:avatar-active={isActive('/profile')}
				title={user?.name ?? ''}
				aria-label="Profile settings for {user?.name ?? 'User'}"
			>
				{userInitial}
			</a>
			<button
				type="button"
				onclick={signOut}
				class="door-btn"
				aria-label="Sign out"
				title="Sign out"
			>
				<Icon name="logout" />
			</button>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 sm:px-6 sm:pb-12">
		<!-- Marker tray on the frame's top rail (desktop) -->
		<nav class="rail hidden items-center gap-1 md:flex" aria-label="Main navigation">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="tray-link"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<Icon name={link.icon} size={17} />
					{link.label}
				</a>
			{/each}
			{#if isAdmin}
				<a href="/admin" class="tray-link" aria-current={isActive('/admin') ? 'page' : undefined}>
					<Icon name="shield" size={17} />
					Admin
				</a>
			{/if}
		</nav>
		<div class="board min-h-[calc(100dvh-6rem)] pb-28 sm:min-h-0 md:pb-0">
			{@render children()}
		</div>
	</main>

	<!-- Marker tray: the phone's navigation, along the bottom rail of the board -->
	<nav class="tray-bar md:hidden" aria-label="Main navigation">
		{#each navLinks as link (link.href)}
			<a
				href={link.href}
				class="tray-bar-link"
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				<Icon name={link.icon} size={22} />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.rail {
		margin: 0 -6px 6px;
		padding: 0.3rem 0.75rem 0.1rem;
		background: var(--frame);
		border-radius: 8px 8px 0 0;
	}
	.tray-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.75rem 0.55rem;
		font-weight: 600;
		color: color-mix(in oklch, var(--ink) 75%, transparent);
		border-radius: 6px;
		transition: color 120ms;
	}
	.tray-link:hover {
		color: var(--ink);
	}
	.tray-link[aria-current='page'] {
		color: var(--ink);
	}
	/* A short marker stroke under the current section */
	.tray-link[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 0.55rem;
		right: 0.45rem;
		bottom: 0.05rem;
		height: 3px;
		border-radius: 3px;
		background: var(--marker-blue);
		rotate: -1.2deg;
	}

	.door-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 999px;
		color: var(--ink-soft);
		transition:
			color 120ms,
			background-color 120ms;
	}
	.door-btn:hover,
	.door-btn[aria-current='page'] {
		color: var(--ink);
		background: color-mix(in oklch, var(--ink) 7%, transparent);
	}

	/* The owner's initial on a round blue magnet */
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		margin-inline: 0.25rem;
		border-radius: 999px;
		font-family: var(--font-marker);
		font-weight: 700;
		color: oklch(99% 0 0deg);
		background: var(--color-primary-500);
		box-shadow: 0 2px 4px -1px hsl(var(--shadow-ink) / 0.4);
		user-select: none;
	}
	.avatar-active {
		outline: 2.5px solid var(--marker-blue);
		outline-offset: 2px;
	}

	/* Pen tray along the frame, fixed to the bottom of the screen */
	.tray-bar {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: 30;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		padding: 0.35rem 0.5rem calc(0.35rem + env(safe-area-inset-bottom));
		background: var(--frame);
		border-top: 1px solid var(--frame-lo);
	}
	@media (min-width: 768px) {
		.tray-bar,
		.door-admin {
			display: none;
		}
	}
	.tray-bar-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.45rem 0 0.35rem;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 700;
		color: color-mix(in oklch, var(--ink) 72%, transparent);
		position: relative;
	}
	.tray-bar-link[aria-current='page'] {
		color: var(--ink);
	}
	.tray-bar-link[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 30%;
		right: 30%;
		bottom: 0.05rem;
		height: 3px;
		border-radius: 3px;
		background: var(--marker-blue);
		rotate: -1.5deg;
	}
	.tray-bar-link[aria-current='page'] :global(svg) {
		color: var(--marker-blue);
	}
</style>
