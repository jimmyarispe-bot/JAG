/**
 * RC-1 — boot-time observability initialization (Node runtime).
 */

import { logger } from "./logger";
import { initTracing } from "./tracing";

let initialized = false;

export function initObservability(): void {
  if (initialized) return;
  initialized = true;
  initTracing();
  logger.info("Observability initialized", {
    otlp: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    rumSampleRate: process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE ?? "1",
    logLevel: process.env.OBSERVABILITY_LOG_LEVEL ?? "info",
  });
}
