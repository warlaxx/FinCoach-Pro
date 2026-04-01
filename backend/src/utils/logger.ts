/**
 * Centralized structured logger for FinCoach API.
 *
 * Format: ISO_TIMESTAMP [LEVEL] [Context] message | {meta}
 *
 * Log level is controlled by the LOG_LEVEL environment variable.
 * Defaults to INFO in production, DEBUG in development.
 */

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 } as const;
type Level = keyof typeof LEVELS;

function getDefaultLevel(): Level {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL.toUpperCase() as Level;
  return process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO';
}

const CURRENT_LEVEL = getDefaultLevel();

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= LEVELS[CURRENT_LEVEL];
}

function serializeMeta(meta: unknown): string {
  if (meta === undefined || meta === null) return '';
  try {
    return ' | ' + JSON.stringify(meta);
  } catch {
    return ' | [unserializable]';
  }
}

function buildLine(level: Level, context: string, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const lvl = level.padEnd(5);
  return `${ts} [${lvl}] [${context}] ${message}${serializeMeta(meta)}`;
}

function emit(level: Level, context: string, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const line = buildLine(level, context, message, meta);
  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

/**
 * Creates a logger scoped to a specific context (e.g. "AuthService", "JwtMiddleware").
 *
 * Usage:
 *   const logger = createLogger('AuthService');
 *   logger.info('Login attempt', { email });
 *   logger.error('bcrypt comparison failed', { userId, reason: err.message });
 */
export function createLogger(context: string): Logger {
  return {
    debug: (msg, meta) => emit('DEBUG', context, msg, meta),
    info:  (msg, meta) => emit('INFO',  context, msg, meta),
    warn:  (msg, meta) => emit('WARN',  context, msg, meta),
    error: (msg, meta) => emit('ERROR', context, msg, meta),
  };
}
