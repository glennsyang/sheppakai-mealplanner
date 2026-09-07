<script lang="ts">
	let { banned }: { banned: boolean } = $props();
</script>

{#if banned}
	<span class="badge preset-filled-error-500">Banned</span>
{:else}
	<span class="badge preset-tonal-success">Active</span>
{/if}
