<script lang="ts">
	let { banned }: { banned: boolean } = $props();
</script>

{#if banned}
	<span class="marker ink-red">banned</span>
{:else}
	<span class="marker ink-green">active</span>
{/if}
