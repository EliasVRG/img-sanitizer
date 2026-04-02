/**
 * Optional debug logger for img-sanitizer.
 * Enabled via debug option or DEBUG=img-sanitizer environment variable.
 * All output goes to stderr to avoid polluting stdout pipelines.
 */

const ENV_DEBUG = process.env['DEBUG']?.includes('img-sanitizer') ?? false;

export type Logger = {
  debug: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
};

/**
 * Creates a logger bound to a specific module name.
 * @param module - Name of the module for log prefix.
 * @param enabled - Whether debug logging is explicitly enabled.
 */
export function createLogger(module: string, enabled: boolean): Logger {
  const isDebug = enabled || ENV_DEBUG;
  const prefix = `[img-sanitizer:${module}]`;

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDebug) {
        process.stderr.write(`${prefix} ${message} ${args.map(String).join(' ')}\n`);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      process.stderr.write(`${prefix} WARN ${message} ${args.map(String).join(' ')}\n`);
    },
  };
}
