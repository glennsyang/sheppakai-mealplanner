<script lang="ts">
	let { role }: { role: string } = $props();
</script>

<span class="badge {role === 'admin' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}">
	{role}
</span>
