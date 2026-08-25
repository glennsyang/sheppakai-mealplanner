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
		'no-unused-expressions': 'error',
		'typescript/no-explicit-any': 'error'
	},
	overrides: [
		{
			// src/lib/server/logger.ts is shared verbatim across sibling repos (see
			// claude-sveltekit-toolkit/plugins/sveltekit-toolkit/shared/server/logger.ts) — it
			// must not be edited per-repo, so lint exceptions for it belong here instead.
			files: ['src/lib/server/logger.ts'],
			rules: {
				'typescript/no-base-to-string': 'off'
			}
		}
	]
});
