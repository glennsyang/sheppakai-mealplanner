<script lang="ts">
	// Renders a sveltekit-superforms banner from the shared `{ type, text }` payload
	// (App.Superforms.Message). Styling is driven by `type`, never by sniffing the
	// wording of `text`. Non-error messages on the auth pages are deliberately
	// understated (the forgot-password / resend flows must not confirm whether an
	// account exists), so `success` maps to the neutral surface tone rather than green.

	interface Props {
		message: App.Superforms.Message | undefined;
	}

	let { message }: Props = $props();

	const isError = $derived(message?.type === 'error');
</script>

{#if message}
	<div
		class="alert text-sm {isError ? 'preset-tonal-error' : 'preset-tonal-surface'}"
		role={isError ? undefined : 'status'}
	>
		{message.text}
	</div>
{/if}
