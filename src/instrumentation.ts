/**
 * Next.js instrumentation — runs once on server startup.
 * Validates environment variables before the application serves traffic.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { ensureEnvironmentValidated } = await import("@/lib/platform/env");

  ensureEnvironmentValidated();
}