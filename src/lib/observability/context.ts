/**
 * RC-1 — request-scoped observability context (AsyncLocalStorage).
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import type { ObservabilityContext } from "./types";

const storage = new AsyncLocalStorage<ObservabilityContext>();

export function newId(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

/** 32-char hex trace id (W3C-compatible length). */
export function newTraceId(): string {
  return newId(16);
}

/** 16-char hex span id. */
export function newSpanId(): string {
  return newId(8);
}

export function getObservabilityContext(): ObservabilityContext | undefined {
  return storage.getStore();
}

export function runWithObservabilityContext<T>(
  ctx: ObservabilityContext,
  fn: () => T
): T {
  return storage.run(ctx, fn);
}

export async function runWithObservabilityContextAsync<T>(
  ctx: ObservabilityContext,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(ctx, fn);
}

export function updateObservabilityContext(
  patch: Partial<ObservabilityContext>
): void {
  const current = storage.getStore();
  if (!current) return;
  Object.assign(current, patch);
}

export function contextFromHeaders(headers: Headers): ObservabilityContext {
  const incomingRequestId =
    headers.get("x-request-id") ?? headers.get("x-correlation-id");
  const incomingTrace =
    headers.get("x-trace-id") ?? parseTraceparent(headers.get("traceparent"));

  return {
    requestId: incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : newId(12),
    traceId: incomingTrace && incomingTrace.length > 0 ? incomingTrace : newTraceId(),
    userId: headers.get("x-jag-user-id") ?? undefined,
    route: headers.get("x-pathname") ?? undefined,
  };
}

function parseTraceparent(value: string | null): string | undefined {
  if (!value) return undefined;
  // version-traceid-spanid-flags
  const parts = value.split("-");
  if (parts.length >= 3 && parts[1]?.length === 32) return parts[1];
  return undefined;
}

export function toTraceparent(ctx: ObservabilityContext): string {
  const spanId = ctx.spanId ?? newSpanId();
  return `00-${ctx.traceId}-${spanId}-01`;
}
