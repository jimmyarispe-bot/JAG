/**
 * Bootstrap — register Phase II intelligence capabilities once — Sprint 207.
 */

import { CapabilityRegistry } from "./CapabilityRegistry";
import { PHASE_II_INTELLIGENCE_MANIFESTS } from "./manifests/intelligence";

/**
 * Idempotent registration. Safe to call from nav, search, or capability pages.
 * Capabilities register themselves through manifests — workspace discovers via loader.
 */
export function ensureCapabilitiesRegistered(): void {
  if (CapabilityRegistry.isBootstrapped()) return;
  for (const manifest of PHASE_II_INTELLIGENCE_MANIFESTS) {
    CapabilityRegistry.register(manifest);
  }
  CapabilityRegistry.markBootstrapped();
  CapabilityRegistry.refreshAllHealth();
  CapabilityRegistry.validateDependencies();
}

/** Test helper — clear and re-register. */
export function resetCapabilitiesForTests(): void {
  CapabilityRegistry.resetForTests();
  ensureCapabilitiesRegistered();
}
