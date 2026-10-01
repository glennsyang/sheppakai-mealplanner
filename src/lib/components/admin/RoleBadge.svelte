<script lang="ts">
	let { role }: { role: string } = $props();
</script>

<span class="marker {role === 'admin' ? 'ink-blue' : 'ink-soft'}">{role}</span>
