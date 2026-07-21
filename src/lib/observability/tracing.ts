/**
 * RC-1 — lightweight OpenTelemetry-compatible span API.
 * Spans are retained in-process and optionally exported via OTLP/HTTP JSON.
 */

import {
  getObservabilityContext,
  newSpanId,
  newTraceId,
  updateObservabilityContext,
} from "./context";
import { logger } from "./logger";
import { metricsRegistry } from "./metrics";
import type { SpanRecord, SpanStatus } from "./types";

const MAX_SPANS = 200;
const spans: SpanRecord[] = [];
let otlpConfigured = false;

export function initTracing(): void {
  otlpConfigured = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  if (otlpConfigured) {
    logger.info("OpenTelemetry OTLP exporter configured", {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
  }
}

function retain(span: SpanRecord): void {
  spans.unshift(span);
  if (spans.length > MAX_SPANS) spans.length = MAX_SPANS;
}

function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export type SpanHandle = {
  spanId: string;
  traceId: string;
  end: (status?: SpanStatus, error?: unknown) => void;
  setAttributes: (attrs: SpanRecord["attributes"]) => void;
};

export function startSpan(
  name: string,
  options?: {
    kind?: SpanRecord["kind"];
    attributes?: SpanRecord["attributes"];
    parentSpanId?: string;
  }
): SpanHandle {
  const ctx = getObservabilityContext();
  const traceId = ctx?.traceId ?? newTraceId();
  const spanId = newSpanId();
  const parentSpanId = options?.parentSpanId ?? ctx?.spanId;
  const start = nowMs();

  const record: SpanRecord = {
    traceId,
    spanId,
    parentSpanId,
    name,
    kind: options?.kind ?? "internal",
    startMs: start,
    status: "ok",
    attributes: { ...(options?.attributes ?? {}) },
  };

  updateObservabilityContext({ spanId, traceId, operation: name });

  return {
    spanId,
    traceId,
    setAttributes(attrs) {
      Object.assign(record.attributes, attrs);
    },
    end(status: SpanStatus = "ok", error?: unknown) {
      const end = nowMs();
      record.endMs = end;
      record.durationMs = Math.round((end - start) * 100) / 100;
      record.status = status;
      if (error instanceof Error) {
        record.errorMessage = error.message;
        record.status = "error";
      }
      retain(record);
      metricsRegistry.recordDuration(`span.${name}`, record.durationMs);
      if (record.status === "error") {
        metricsRegistry.increment("errors.total");
      }
      void exportSpan(record);
      if (ctx?.spanId === spanId) {
        updateObservabilityContext({ spanId: parentSpanId, operation: undefined });
      }
    },
  };
}

export async function withSpan<T>(
  name: string,
  fn: (span: SpanHandle) => Promise<T>,
  options?: Parameters<typeof startSpan>[1]
): Promise<T> {
  const span = startSpan(name, options);
  try {
    const result = await fn(span);
    span.end("ok");
    return result;
  } catch (error) {
    span.end("error", error);
    throw error;
  }
}

export function listRecentSpans(limit = 40): SpanRecord[] {
  return spans.slice(0, limit);
}

async function exportSpan(span: SpanRecord): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint || !span.durationMs) return;

  const url = endpoint.replace(/\/$/, "") + "/v1/traces";
  const body = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: "service.name",
              value: { stringValue: process.env.OTEL_SERVICE_NAME ?? "jag" },
            },
          ],
        },
        scopeSpans: [
          {
            spans: [
              {
                traceId: span.traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId,
                name: span.name,
                kind: span.kind === "server" ? 1 : 2,
                startTimeUnixNano: String(Math.round(span.startMs * 1e6)),
                endTimeUnixNano: String(Math.round((span.endMs ?? span.startMs) * 1e6)),
                status: { code: span.status === "error" ? 2 : 1 },
                attributes: Object.entries(span.attributes)
                  .filter(([, v]) => v !== undefined)
                  .map(([key, value]) => ({
                    key,
                    value:
                      typeof value === "number"
                        ? { doubleValue: value }
                        : typeof value === "boolean"
                          ? { boolValue: value }
                          : { stringValue: String(value) },
                  })),
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? Object.fromEntries(
              process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map((pair) => {
                const [k, ...rest] = pair.split("=");
                return [k.trim(), rest.join("=").trim()];
              })
            )
          : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    logger.debug("OTLP export failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
