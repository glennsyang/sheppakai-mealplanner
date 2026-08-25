/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*.{js,ts,svelte}': ['npm run fmt', "sh -c 'npm run lint'"],
	'*.svelte': "sh -c 'svelte-check --threshold error'",
	'*.{json,md,css,html,svg}': ['npm run fmt']
};
