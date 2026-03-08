<script lang="ts">
  import { enhance } from '$app/forms';
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg">
		<div>
			<h1 class="text-3xl font-bold">Sign Out</h1>
			<p class="mt-2 text-gray-600">Are you sure you want to sign out?</p>
		</div>

		<form method="POST" use:enhance><button type="submit" class="w-full">Sign Out</button></form>

		<div class="text-center"><a href="/dashboard" class="text-sm"> Cancel </a></div>
	</div>
</div>