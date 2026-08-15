type LogLevel = 'debug' | 'error' | 'info' | 'warn';

interface LogFields {
  [key: string]: unknown;
}

interface SerializedError {
  cause?: SerializedError;
  message: string;
  name: string;
  stack?: string;
}

interface Logger {
  debug: (event: string, fields?: LogFields) => void;
  error: (event: string, error: unknown, fields?: LogFields) => void;
  info: (event: string, fields?: LogFields) => void;
  warn: (event: string, fields?: LogFields) => void;
}

const MAX_ERROR_CAUSE_DEPTH = 2;

export function createLogger(scope: string): Logger {
  return {
    debug: (event, fields) => writeLog('debug', scope, event, fields),
    error: (event, error, fields) =>
      writeLog('error', scope, event, {
        ...fields,
        error: serializeError(error),
      }),
    info: (event, fields) => writeLog('info', scope, event, fields),
    warn: (event, fields) => writeLog('warn', scope, event, fields),
  };
}

export function elapsedMilliseconds(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

function writeLog(
  level: LogLevel,
  scope: string,
  event: string,
  fields: LogFields = {},
) {
  const entry = {
    level,
    scope,
    event,
    runtime: typeof window === 'undefined' ? 'worker' : 'browser',
    ...fields,
  };

  switch (level) {
    case 'debug':
      console.debug(entry);
      break;
    case 'error':
      console.error(entry);
      break;
    case 'warn':
      console.warn(entry);
      break;
    default:
      console.info(entry);
  }
}

function serializeError(error: unknown, depth = 0): SerializedError {
  if (error instanceof Error) {
    const cause =
      depth < MAX_ERROR_CAUSE_DEPTH && error.cause !== undefined
        ? serializeError(error.cause, depth + 1)
        : undefined;

    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(cause ? { cause } : {}),
    };
  }

  if (typeof Event !== 'undefined' && error instanceof Event) {
    return { name: error.constructor.name, message: error.type };
  }

  return {
    name: typeof error,
    message: safelyStringify(error),
  };
}

function safelyStringify(value: unknown) {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify({ value });
  } catch {
    return String(value);
  }
}
