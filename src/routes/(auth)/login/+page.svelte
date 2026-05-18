<script lang="ts">
  import { loginSchema } from '$lib/schemas/auth';
  import { expoOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';

  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally — superForm is intentionally initialized once from props
  const { form, errors, constraints, enhance, message, submitting } = superForm(data.form, {
    validators: zod4Client(loginSchema),
  });
</script>

<svelte:head>
  <title>Sign In — MealPlanner</title>
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
        "Plan your week<br />with intention."
      </blockquote>
      <p class="text-primary-100 max-w-xs text-sm leading-relaxed font-light">
        From pantry to plate — discover dinners from what you already have, then build your week
        around them.
      </p>
    </div>
    <p class="text-primary-200 text-xs">© 2026 Meal Planner</p>
  </div>

  <!-- Form panel -->
  <div class="bg-surface-50-950 flex flex-1 items-center justify-center p-8">
    <div class="w-full max-w-sm space-y-8" in:fly={{ y: 20, duration: 450, easing: expoOut }}>
      <!-- Mobile wordmark -->
      <div class="mb-2 text-center lg:hidden">
        <span class="font-serif text-xl font-semibold">Meal</span><span
          class="text-primary-600 font-serif text-xl font-semibold italic">&nbsp;Planner</span
        >
      </div>

      <div class="space-y-1">
        <h1 class="h2 font-semibold tracking-tight">Welcome back</h1>
        <p class="text-surface-500 text-sm font-light">Sign in to continue planning</p>
      </div>

      {#if $message}
        <div class="alert preset-tonal-error text-sm">{$message}</div>
      {/if}

      <form method="POST" use:enhance class="space-y-5">
        <label class="label">
          <span class="label-text text-sm font-medium">Email</span>
          <input
            type="email"
            name="email"
            bind:value={$form.email}
            class="input mt-1"
            class:input-error={$errors.email}
            required={$constraints.email?.required}
            placeholder="you@example.com"
            autocomplete="email"
          />
          {#if $errors.email}
            <span class="text-error-500 mt-1 block text-xs">{$errors.email}</span>
          {/if}
        </label>

        <label class="label">
          <span class="label-text text-sm font-medium">Password</span>
          <input
            type="password"
            name="password"
            bind:value={$form.password}
            class="input mt-1"
            class:input-error={$errors.password}
            required={$constraints.password?.required}
            placeholder="••••••••••••"
            autocomplete="current-password"
          />
          {#if $errors.password}
            <span class="text-error-500 mt-1 block text-xs">{$errors.password}</span>
          {/if}
        </label>

        <button
          type="submit"
          disabled={$submitting}
          class="btn preset-filled-primary-500 mt-2 w-full"
        >
          {$submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p class="text-surface-500 text-center text-sm">
        No account yet?&ensp;<a
          href="/register"
          class="text-primary-600 font-medium underline-offset-2 hover:underline">Create one</a
        >
      </p>
    </div>
  </div>
</div>
