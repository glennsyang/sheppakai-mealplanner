/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*.{js,ts,svelte}': ['npm run fmt', "sh -c 'npm run lint'"],
	'*.svelte': "sh -c 'svelte-check --threshold error'",
	// CLAUDE.md/AGENTS.md and package-lock.json are excluded here to match oxfmt.config.ts's
	// ignorePatterns — oxfmt errors when given only an ignored file as its sole target, which
	// otherwise blocks lockfile-only commits (e.g. a transitive security bump).
	'!(package-lock).json': ['npm run fmt'],
	'*.{css,html,svg}': ['npm run fmt'],
	'!(CLAUDE|AGENTS).md': ['npm run fmt'],
	'**/+{page,layout}.server.{ts,js}': (filenames: string[]) =>
		`node scripts/check-redirect-throws.mjs ${filenames.map((f) => `"${f}"`).join(' ')}`,
	'**/+server.{ts,js}': (filenames: string[]) =>
		`node scripts/check-redirect-throws.mjs ${filenames.map((f) => `"${f}"`).join(' ')}`
};
