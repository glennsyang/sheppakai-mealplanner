import path from 'node:path';

import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      org: 'sheppakai',
      project: 'sheppakai-mealplanner',
    }),
    tailwindcss(),
    sveltekit(),
  ],
  server: {
    watch: {
      ignored: ['**/data/**', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: {
      // Resolve Skeleton theme CSS via direct path (enhanced-resolve doesn't support pattern exports for CSS)
      '@skeletonlabs/skeleton/themes': path.resolve(
        './node_modules/@skeletonlabs/skeleton/src/themes',
      ),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,svelte.ts}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/routes/**', 'src/app.ts'],
      reporter: ['text', 'lcov', 'html', 'json-summary', 'json'],
    },
    reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default'],
  },
});
