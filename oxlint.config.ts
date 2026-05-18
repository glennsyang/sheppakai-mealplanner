import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['unicorn', 'typescript', 'oxc'],
  categories: { correctness: 'warn' },
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: [
    '**/node_modules',
    '**/.claude',
    '.svelte-kit',
    'build',
    '**/.DS_Store',
    '**/.env',
    '**/.env.*',
    '!**/.env.example',
    '!**/.env.test',
    '**/*.db',
  ],
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-unused-expressions': 'error',
  },
});
