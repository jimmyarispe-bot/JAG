/**
 * RC-1 — instrumentation helpers for API routes, server actions, workspace, intel, integrations.
 * Wrappers do not change business return values — they only observe.
 */

import {
  contextFromHeaders,
  getObservabilityContext,
  newId,
  newTraceId,
  updateObservabilityContext,
} from "./context";
import { logger } from "./logger";
import { metricsRegistry } from "./metrics";
import { startSpan, withSpan } from "./tracing";
import type { ObservabilityContext } from "./types";

function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export { contextFromHeaders };

/** Record an authenticated API / RSC request duration. */
export function recordHttpRequest(input: {
  route: string;
  method?: string;
  status?: number;
  durationMs: number;
  userId?: string;
  organizationId?: string;
}): void {
  metricsRegistry.recordDuration("http.server.duration", input.durationMs);
  metricsRegistry.recordDuration(`http.route.${input.route}`, input.durationMs);
  metricsRegistry.increment("http.server.requests");
  if (input.status && input.status >= 500) {
    metricsRegistry.increment("errors.api");
    metricsRegistry.increment("errors.total");
  }
  metricsRegistry.noteActiveUser(input.userId);
  if (input.organizationId) {
    updateObservabilityContext({ organizationId: input.organizationId });
  }
}

/** Observe a server action without changing its contract. */
export async function observeServerAction<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return withSpan(
    `action.${name}`,
    async (span) => {
      updateObservabilityContext({ operation: name });
      const started = nowMs();
      try {
        const result = await fn();
        const durationMs = Math.round((nowMs() - started) * 100) / 100;
        metricsRegistry.recordDuration("action.duration", durationMs);
        metricsRegistry.recordDuration(`action.${name}`, durationMs);
        span.setAttributes({ ...(attributes ?? {}), durationMs });
        logger.debug("Server action completed", {
          operation: name,
          durationMs,
        });
        return result;
      } catch (error) {
        metricsRegistry.increment("errors.action");
        metricsRegistry.increment("errors.total");
        logger.error("Server action failed", error, { operation: name });
        throw error;
      }
    },
    { kind: "internal", attributes }
  );
}

export async function observeWorkspaceExecution<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return withSpan(
    `workspace.${name}`,
    async () => {
      const started = nowMs();
      try {
        const result = await fn();
        const durationMs = nowMs() - started;
        metricsRegistry.recordDuration("workspace.duration", durationMs);
        metricsRegistry.recordDuration(`workspace.${name}`, durationMs);
        return result;
      } catch (error) {
        metricsRegistry.increment("errors.total");
        throw error;
      }
    },
    { kind: "internal", attributes: { ...attributes, domain: "workspace" } }
  );
}

export async function observeExecutiveIntelligence<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return withSpan(
    `intel.${name}`,
    async () => {
      const started = nowMs();
      try {
        const result = await fn();
        const durationMs = nowMs() - started;
        metricsRegistry.recordDuration("intel.duration", durationMs);
        metricsRegistry.recordDuration(`intel.${name}`, durationMs);
        return result;
      } catch (error) {
        metricsRegistry.increment("errors.total");
        throw error;
      }
    },
    {
      kind: "internal",
      attributes: { ...attributes, domain: "executive_intelligence" },
    }
  );
}

export async function observeIntegration<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return withSpan(
    `integration.${name}`,
    async () => {
      const started = nowMs();
      try {
        const result = await fn();
        const durationMs = nowMs() - started;
        metricsRegistry.recordDuration("integration.duration", durationMs);
        metricsRegistry.recordDuration(`integration.${name}`, durationMs);
        return result;
      } catch (error) {
        metricsRegistry.increment("errors.total");
        throw error;
      }
    },
    { kind: "client", attributes: { ...attributes, domain: "integrations" } }
  );
}

/**
 * Ensure an observability context exists for the current async chain.
 * Prefer middleware-provided request/trace ids when available.
 */
export function ensureObservabilityContext(
  partial?: Partial<ObservabilityContext>
): ObservabilityContext {
  const existing = getObservabilityContext();
  if (existing) {
    if (partial) updateObservabilityContext(partial);
    return { ...existing, ...partial };
  }
  return {
    requestId: partial?.requestId ?? newId(12),
    traceId: partial?.traceId ?? newTraceId(),
    ...partial,
  };
}

/** Bridge legacy performance cache counters into observability metrics. */
export function recordCacheHit(): void {
  metricsRegistry.increment("cache.hit");
}

export function recordCacheMiss(): void {
  metricsRegistry.increment("cache.miss");
}

export function beginMiddlewareObservation(headers: Headers): {
  ctx: ObservabilityContext;
  started: number;
  applyResponseHeaders: (responseHeaders: Headers) => void;
  finish: (route: string, status?: number) => void;
} {
  const ctx = contextFromHeaders(headers);
  const started = nowMs();
  const span = startSpan("http.middleware", {
    kind: "server",
    attributes: { route: ctx.route },
  });

  return {
    ctx,
    started,
    applyResponseHeaders(responseHeaders) {
      responseHeaders.set("x-request-id", ctx.requestId);
      responseHeaders.set("x-trace-id", ctx.traceId);
      responseHeaders.set("traceparent", `00-${ctx.traceId}-${span.spanId}-01`);
    },
    finish(route: string, status?: number) {
      const durationMs = Math.round((nowMs() - started) * 100) / 100;
      recordHttpRequest({
        route,
        durationMs,
        status,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      });
      span.setAttributes({ route, status: status ?? 0, durationMs });
      span.end(status && status >= 500 ? "error" : "ok");
    },
  };
}
