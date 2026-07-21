/**
 * RC-1 — edge-safe request / trace id helpers (no Node-only APIs).
 * Safe to import from Next.js middleware.
 */

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type RequestTraceIds = {
  requestId: string;
  traceId: string;
  spanId: string;
};

export function resolveRequestTraceIds(headers: Headers): RequestTraceIds {
  const incomingRequestId =
    headers.get("x-request-id") ?? headers.get("x-correlation-id");
  const incomingTrace =
    headers.get("x-trace-id") ?? parseTraceparentTraceId(headers.get("traceparent"));

  return {
    requestId:
      incomingRequestId && incomingRequestId.length > 0
        ? incomingRequestId
        : randomHex(12),
    traceId:
      incomingTrace && incomingTrace.length === 32 ? incomingTrace : randomHex(16),
    spanId: randomHex(8),
  };
}

function parseTraceparentTraceId(value: string | null): string | undefined {
  if (!value) return undefined;
  const parts = value.split("-");
  if (parts.length >= 3 && parts[1]?.length === 32) return parts[1];
  return undefined;
}

export function applyTraceHeaders(
  headers: Headers,
  ids: RequestTraceIds
): void {
  headers.set("x-request-id", ids.requestId);
  headers.set("x-trace-id", ids.traceId);
  headers.set("traceparent", `00-${ids.traceId}-${ids.spanId}-01`);
}
