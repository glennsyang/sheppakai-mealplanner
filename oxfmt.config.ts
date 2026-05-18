import { defineConfig } from 'oxfmt';

export default defineConfig({
  arrowParens: 'always',
  ignorePatterns: ['.svelte-kit', 'build', 'node_modules', 'coverage', '*.toml'],
  printWidth: 100,
  semi: true,
  singleQuote: true,
  sortImports: true,
  sortTailwindcss: true,
  svelte: true,
  tabWidth: 2,
  useTabs: false,
});
