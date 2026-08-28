<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Verify Your Email — Meal Planner</title>
</svelte:head>

<div class="flex min-h-dvh">
	<!-- Brand panel — hidden on mobile, visible lg+ -->
	<div
		class="auth-brand-panel hidden justify-between p-12 text-white lg:flex lg:w-5/12 lg:flex-col"
	>
		<div>
			<span class="font-serif text-xl font-semibold tracking-tight">Meal</span><span
				class="font-serif text-xl font-semibold tracking-tight italic">&nbsp;Planner</span
			>
		</div>
		<div class="space-y-6">
			<blockquote class="font-serif text-4xl leading-tight font-semibold tracking-tight italic">
				"Almost there."
			</blockquote>
			<p class="text-primary-100 max-w-xs text-sm leading-relaxed font-light">
				Confirm your email address and you'll be all set to start planning your week.
			</p>
		</div>
		<p class="text-primary-200 text-xs">© 2026 Meal Planner</p>
	</div>

	<!-- Content panel -->
	<div class="bg-surface-50-950 flex flex-1 items-center justify-center p-8">
		<div class="w-full max-w-sm space-y-8">
			<!-- Mobile wordmark -->
			<div class="mb-2 text-center lg:hidden">
				<span class="font-serif text-xl font-semibold">Meal</span><span
					class="text-primary-600 font-serif text-xl font-semibold italic">&nbsp;Planner</span
				>
			</div>

			<div class="text-center">
				<div
					class="bg-primary-500/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-primary-600"
						aria-hidden="true"
					>
						<rect x="2" y="4" width="20" height="16" rx="2" />
						<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
					</svg>
				</div>
				<h1 class="h2 font-semibold tracking-tight">Check your email</h1>
				<p class="text-surface-500 mt-2 text-sm">We've sent a verification link to</p>
				<p class="mt-1 text-sm font-medium">{data.email}</p>
			</div>

			<div class="card preset-outlined-surface-300-700 space-y-4 p-6">
				<div>
					<h2 class="font-semibold">Next steps:</h2>
					<ol class="text-surface-500 mt-3 space-y-2 text-sm">
						<li class="flex items-start">
							<span class="mr-2 font-semibold">1.</span>
							<span>Open the email we just sent you</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 font-semibold">2.</span>
							<span>Click the verification link in the email</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 font-semibold">3.</span>
							<span>You'll be automatically signed in and redirected to your dashboard</span>
						</li>
					</ol>
				</div>

				<div class="bg-surface-100-900 rounded-md p-3">
					<p class="text-surface-500 text-xs">
						💡 <strong>Tip:</strong> If you don't see the email, check your spam or junk folder. The verification
						link will expire in 10 minutes.
					</p>
				</div>
			</div>

			<p class="text-surface-500 text-center text-sm">
				Wrong email address?
				<a href="/register" class="text-primary-600 font-medium hover:underline">
					Register again
				</a>
			</p>

			<a href="/login" class="btn preset-outlined-surface-500 w-full">Back to sign in</a>
		</div>
	</div>
</div>
