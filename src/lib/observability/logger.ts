/**
 * RC-1 — structured JSON logging (machine-readable).
 * Never logs secrets or raw PII beyond opaque ids already on the context.
 */

import { getObservabilityContext } from "./context";
import type { LogSeverity, ObservabilityContext } from "./types";

export type StructuredLogFields = {
  severity: LogSeverity;
  message: string;
  operation?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  route?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

function resolveLevel(): LogSeverity {
  const raw = (process.env.OBSERVABILITY_LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

const LEVEL_RANK: Record<LogSeverity, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldEmit(severity: LogSeverity): boolean {
  return LEVEL_RANK[severity] >= LEVEL_RANK[resolveLevel()];
}

function baseFields(ctx?: ObservabilityContext) {
  return {
    ts: new Date().toISOString(),
    service: process.env.OTEL_SERVICE_NAME ?? "jag",
    requestId: ctx?.requestId,
    traceId: ctx?.traceId,
    spanId: ctx?.spanId,
    organizationId: ctx?.organizationId,
    userId: ctx?.userId,
  };
}

export function logStructured(fields: StructuredLogFields): void {
  if (!shouldEmit(fields.severity)) return;
  const ctx = getObservabilityContext();
  const payload = {
    ...baseFields(ctx),
    severity: fields.severity,
    message: fields.message,
    operation: fields.operation ?? ctx?.operation,
    durationMs: fields.durationMs,
    errorCode: fields.errorCode,
    errorMessage: fields.errorMessage,
    route: fields.route ?? ctx?.route,
    ...fields.meta,
  };

  const line = JSON.stringify(payload);
  if (fields.severity === "error") console.error(line);
  else if (fields.severity === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: StructuredLogFields["meta"]) =>
    logStructured({ severity: "debug", message, meta }),
  info: (message: string, meta?: StructuredLogFields["meta"]) =>
    logStructured({ severity: "info", message, meta }),
  warn: (message: string, meta?: StructuredLogFields["meta"]) =>
    logStructured({ severity: "warn", message, meta }),
  error: (
    message: string,
    err?: unknown,
    meta?: StructuredLogFields["meta"]
  ) =>
    logStructured({
      severity: "error",
      message,
      errorMessage: err instanceof Error ? err.message : err != null ? String(err) : undefined,
      meta,
    }),
};
