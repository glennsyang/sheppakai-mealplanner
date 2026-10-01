<script lang="ts" module>
	// Lucide paths (ISC licence), drawn at one stroke weight so every icon reads as the
	// same marker.
	const paths = {
		home: [
			'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
			'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
		],
		calendar: [
			'M8 2v4',
			'M16 2v4',
			'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z',
			'M3 10h18'
		],
		sparkles: [
			'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
			'M20 2v4',
			'M22 4h-4'
		],
		basket: [
			'm15 11-1 9',
			'm19 11-4-7',
			'M2 11h20',
			'm3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4',
			'M4.5 15.5h15',
			'm5 11 4-7',
			'm9 11 1 9'
		],
		user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M8 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0'],
		shield: [
			'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'
		],
		sun: [
			'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
			'M12 2v2',
			'M12 20v2',
			'm4.93 4.93 1.41 1.41',
			'm17.66 17.66 1.41 1.41',
			'M2 12h2',
			'M20 12h2',
			'm6.34 17.66-1.41 1.41',
			'm19.07 4.93-1.41 1.41'
		],
		moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
		logout: ['m16 17 5-5-5-5', 'M21 12H9', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'],
		left: ['m15 18-6-6 6-6'],
		right: ['m9 18 6-6-6-6'],
		x: ['M18 6 6 18', 'm6 6 12 12'],
		plus: ['M5 12h14', 'M12 5v14'],
		clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 6v6l4 2'],
		servings: [
			'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
			'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
			'M22 21v-2a4 4 0 0 0-3-3.87',
			'M16 3.13a4 4 0 0 1 0 7.75'
		],
		book: [
			'M12 7v14',
			'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'
		],
		shuffle: [
			'm18 14 4 4-4 4',
			'm18 2 4 4-4 4',
			'M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22',
			'M2 6h1.972a4 4 0 0 1 3.6 2.2',
			'M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45'
		],
		eraser: [
			'M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21',
			'm5.082 11.09 8.828 8.828'
		],
		pencil: [
			'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
			'm15 5 4 4'
		],
		arrow: ['M5 12h14', 'm12 5 7 7-7 7'],
		check: ['M20 6 9 17l-5-5'],
		loader: ['M21 12a9 9 0 1 1-6.219-8.56']
	} as const satisfies Record<string, readonly string[]>;

	export type IconName = keyof typeof paths;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		size?: number;
		class?: string;
	}

	let { name, size = 18, class: className = '' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class="shrink-0 {className}"
>
	{#each paths[name] as d (d)}
		<path {d} />
	{/each}
</svg>
