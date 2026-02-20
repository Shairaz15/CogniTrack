/**
 * Logger Utility
 * Centralized logging that respects environment settings.
 * In production, only errors are logged unless VITE_LOG_LEVEL is set.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function getLogLevel(): LogLevel {
    const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
        return envLevel;
    }
    // In development, log everything; in production, only errors
    return import.meta.env.DEV ? 'debug' : 'error';
}

const currentLogLevel = getLogLevel();
const minLevel = LOG_LEVELS[currentLogLevel];

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= minLevel;
}

export const logger = {
    debug: (...args: unknown[]) => {
        if (shouldLog('debug')) {
            console.debug('[DEBUG]', ...args);
        }
    },
    info: (...args: unknown[]) => {
        if (shouldLog('info')) {
            console.info('[INFO]', ...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (shouldLog('warn')) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors, even in production
        console.error('[ERROR]', ...args);
    },
};
