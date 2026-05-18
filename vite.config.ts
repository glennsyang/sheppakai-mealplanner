import path from 'path';

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      // Resolve Skeleton theme CSS via direct path (enhanced-resolve doesn't support pattern exports for CSS)
      '@skeletonlabs/skeleton/themes': path.resolve(
        './node_modules/@skeletonlabs/skeleton/src/themes',
      ),
    },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'node',
  },
});
