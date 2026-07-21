/**
 * Next.js instrumentation — runs once on server startup.
 * Validates environment variables and initializes RC-1 observability.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { ensureEnvironmentValidated } = await import("@/lib/platform/env");
  const { initObservability } = await import("@/lib/observability");

  ensureEnvironmentValidated();
  initObservability();
}