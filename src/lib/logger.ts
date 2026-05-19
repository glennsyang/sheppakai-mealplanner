type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
const IS_PROD = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, data?: unknown): void {
	if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;

	if (IS_PROD) {
		const entry = JSON.stringify({
			level,
			message,
			...(data !== undefined ? { data } : {}),
			timestamp: new Date().toISOString()
		});
		process.stdout.write(entry + '\n');
	} else {
		const prefix = `[${level.toUpperCase()}]`;
		const parts = [prefix, message];
		if (data !== undefined) parts.push(JSON.stringify(data));
		process.stdout.write(parts.join(' ') + '\n');
	}
}

export const logger = {
	debug: (message: string, data?: unknown) => log('debug', message, data),
	info: (message: string, data?: unknown) => log('info', message, data),
	warn: (message: string, data?: unknown) => log('warn', message, data),
	error: (message: string, data?: unknown) => log('error', message, data)
};
