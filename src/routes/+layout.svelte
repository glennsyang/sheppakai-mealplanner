<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>MealPlanner</title>
</svelte:head>

<!-- modeStorageKey keeps existing users' preference; defaultTheme stops ModeWatcher clearing data-theme. -->
<ModeWatcher modeStorageKey="color-scheme" defaultTheme="pine" disableHeadScriptInjection />

{@render children()}
