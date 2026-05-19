import { defineConfig } from 'oxlint';

export default defineConfig({
	categories: { correctness: 'error', perf: 'off', style: 'off', suspicious: 'off' },
	env: {
		browser: true,
		node: true,
		svelte: true,
		vitest: true
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
		'**/*.db'
	],
	options: {
		typeAware: true,
		typeCheck: true
	},
	plugins: ['eslint', 'typescript', 'oxc', 'vitest', 'unicorn'],
	rules: {
		'no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}
		],
		'no-unused-expressions': 'error'
	}
});
