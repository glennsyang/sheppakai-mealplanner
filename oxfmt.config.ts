import { defineConfig } from 'oxfmt';

export default defineConfig({
	arrowParens: 'always',
	ignorePatterns: [
		'.svelte-kit',
		'build',
		'coverage',
		'node_modules',
		'package-lock.json',
		'/static',
		'/drizzle',
		'/.github/skills/',
		'/AGENTS.md',
		'CLAUDE.md',
		'*.toml'
	],
	printWidth: 100,
	semi: true,
	singleQuote: true,
	sortImports: true,
	sortTailwindcss: true,
	svelte: true,
	tabWidth: 2,
	trailingComma: 'none',
	useTabs: true
});
