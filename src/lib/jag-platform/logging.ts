/**
 * Unified logging for The JAG™ portal modules.
 * Never log OAuth tokens, credentials, secrets, or sensitive PII.
 */

export type JagLogLevel = "information" | "warning" | "error" | "security" | "audit";

export type JagLogEntry = {
  readonly level: JagLogLevel;
  readonly module: string;
  readonly message: string;
  readonly correlationId?: string;
  readonly organizationId?: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
  readonly at: string;
};

const SENSITIVE_KEY =
  /(token|secret|password|credential|authorization|api[_-]?key|refresh|access[_-]?token|ssn|dob)/i;

function sanitizeMetadata(
  metadata?: Readonly<Record<string, string | number | boolean | null>>
): Readonly<Record<string, string | number | boolean | null>> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && SENSITIVE_KEY.test(value)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return Object.freeze(out);
}

type LogSink = (entry: JagLogEntry) => void;

const g = globalThis as typeof globalThis & {
  __jagPlatformLogBuffer?: JagLogEntry[];
  __jagPlatformLogSink?: LogSink;
};

function buffer(): JagLogEntry[] {
  if (!g.__jagPlatformLogBuffer) g.__jagPlatformLogBuffer = [];
  return g.__jagPlatformLogBuffer;
}

export function resetJagPlatformLogsForTests(): void {
  g.__jagPlatformLogBuffer = [];
}

export function listRecentJagPlatformLogs(limit = 50): readonly JagLogEntry[] {
  return buffer().slice(-limit);
}

export function setJagPlatformLogSinkForTests(sink: LogSink | null): void {
  g.__jagPlatformLogSink = sink ?? undefined;
}

export function jagLog(input: {
  level: JagLogLevel;
  module: string;
  message: string;
  correlationId?: string;
  organizationId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): JagLogEntry {
  const entry: JagLogEntry = {
    level: input.level,
    module: input.module,
    message: input.message,
    correlationId: input.correlationId,
    organizationId: input.organizationId,
    metadata: sanitizeMetadata(input.metadata),
    at: new Date().toISOString(),
  };

  buffer().push(entry);
  if (buffer().length > 500) {
    g.__jagPlatformLogBuffer = buffer().slice(-400);
  }

  if (g.__jagPlatformLogSink) {
    g.__jagPlatformLogSink(entry);
  } else if (input.level === "error" || input.level === "security") {
    console.error(
      `[jag:${entry.level}] ${entry.module} ${entry.message}`,
      entry.correlationId ?? "",
      entry.metadata ?? {}
    );
  } else if (process.env.NODE_ENV !== "production" && input.level === "warning") {
    console.warn(`[jag:${entry.level}] ${entry.module} ${entry.message}`);
  }

  return entry;
}

export const jagLogger = {
  information: (
    module: string,
    message: string,
    meta?: Omit<Parameters<typeof jagLog>[0], "level" | "module" | "message">
  ) => jagLog({ level: "information", module, message, ...meta }),
  warning: (
    module: string,
    message: string,
    meta?: Omit<Parameters<typeof jagLog>[0], "level" | "module" | "message">
  ) => jagLog({ level: "warning", module, message, ...meta }),
  error: (
    module: string,
    message: string,
    meta?: Omit<Parameters<typeof jagLog>[0], "level" | "module" | "message">
  ) => jagLog({ level: "error", module, message, ...meta }),
  security: (
    module: string,
    message: string,
    meta?: Omit<Parameters<typeof jagLog>[0], "level" | "module" | "message">
  ) => jagLog({ level: "security", module, message, ...meta }),
  audit: (
    module: string,
    message: string,
    meta?: Omit<Parameters<typeof jagLog>[0], "level" | "module" | "message">
  ) => jagLog({ level: "audit", module, message, ...meta }),
};
