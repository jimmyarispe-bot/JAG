import { ensureJAGBooted } from "@/jag/runtime/boot";
import { requireJagServiceBridge } from "@/jag/runtime/package-host";
// Ensure starter is bound when resolving services.
import "@/jag/runtime/start";

/**
 * Resolve an application service through the JAG runtime.
 * Delegates to the service bridge bound by the active package host.
 */
export function resolveJAGService(name: string): unknown {
  ensureJAGBooted();
  return requireJagServiceBridge().resolve(name);
}

export function listJAGServiceNames(): readonly string[] {
  return requireJagServiceBridge().listNames();
}
