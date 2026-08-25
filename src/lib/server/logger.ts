import * as Sentry from '@sentry/sveltekit';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const IS_DEV = process.env.NODE_ENV !== 'production';
const MIN_LEVEL: LogLevel =
	(process.env.LOG_LEVEL as LogLevel | undefined) ?? (IS_DEV ? 'debug' : 'info');

interface LogContext {
	requestId?: string;
	[key: string]: unknown;
}

// Stripped from log output and Sentry payloads once IS_DEV is false.
const PII_FIELDS = new Set(['userId', 'id', 'email', 'password', 'token', 'createdBy', 'updatedBy']);

function sanitize(value: unknown): unknown {
	if (IS_DEV || value === undefined || value === null) return value;
	if (value instanceof Error) return { name: value.name, message: value.message };
	if (typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map(sanitize);

	const out: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
		if (PII_FIELDS.has(key)) continue;
		out[key] = sanitize(val);
	}
	return out;
}

function serializeError(error: unknown): unknown {
	if (error instanceof Error) {
		return {
			name: error.name,
			message: error.message,
			...(IS_DEV && error.stack ? { stack: error.stack } : {})
		};
	}
	if (typeof error === 'string' || error === undefined) return error;
	try {
		return JSON.parse(
			JSON.stringify(error, (_key, val) =>
				val instanceof Error ? { name: val.name, message: val.message } : val
			)
		);
	} catch {
		return String(error);
	}
}

class Logger {
	private context: LogContext;

	constructor(context: LogContext = {}) {
		this.context = context;
	}

	child(context: LogContext): Logger {
		return new Logger({ ...this.context, ...context });
	}

	private write(level: LogLevel, message: string, extra?: Record<string, unknown>) {
		if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
		const entry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			...(sanitize(this.context) as Record<string, unknown>),
			...(extra !== undefined ? (sanitize(extra) as Record<string, unknown>) : {})
		};
		const line = JSON.stringify(entry);
		if (level === 'debug') console.debug(line);
		else if (level === 'info') console.info(line);
		else if (level === 'warn') console.warn(line);
		else console.error(line);
	}

	private sentryExtra(meta?: Record<string, unknown>): Record<string, unknown> {
		return {
			...(sanitize(this.context) as Record<string, unknown>),
			...(meta !== undefined ? (sanitize(meta) as Record<string, unknown>) : {})
		};
	}

	debug(message: string, meta?: Record<string, unknown>) {
		this.write('debug', message, meta);
	}

	info(message: string, meta?: Record<string, unknown>) {
		this.write('info', message, meta);
	}

	warn(message: string, meta?: Record<string, unknown>) {
		this.write('warn', message, meta);
		if (!IS_DEV) {
			Sentry.captureMessage(message, {
				level: 'warning',
				tags: { source: 'logger' },
				extra: this.sentryExtra(meta)
			});
		}
	}

	error(message: string, error?: unknown, meta?: Record<string, unknown>) {
		this.write('error', message, {
			...(error !== undefined ? { error: serializeError(error) } : {}),
			...meta
		});
		if (!IS_DEV) {
			if (error instanceof Error) {
				Sentry.captureException(error, {
					tags: { source: 'logger' },
					extra: { message, ...this.sentryExtra(meta) }
				});
			} else {
				Sentry.captureMessage(message, {
					level: 'error',
					tags: { source: 'logger' },
					extra: { error, ...this.sentryExtra(meta) }
				});
			}
		}
	}
}

export const logger = new Logger();
