/**
 * P005 — Process-safe shared IntegrationPlatform (connector registry + persistence).
 *
 * ECC management and Organization Platform both consume this instance so
 * `registerAllConnectors` runs once per process. Request-scoped sync state
 * remains on connector stores / ensure* helpers — not here.
 */

import {
  createIntegrationPlatform,
  type IntegrationPlatform,
} from "@/lib/platform/integrations/common/services/platform";
import { registerAllConnectors } from "@/lib/platform/integrations/connectors/registry";

let registeredPlatform: IntegrationPlatform | null = null;

/** Process-wide registered integration platform (connectors catalog ready). */
export function getOrCreateRegisteredIntegrationPlatform(): IntegrationPlatform {
  if (!registeredPlatform) {
    registeredPlatform = registerAllConnectors(createIntegrationPlatform());
  }
  return registeredPlatform;
}

/** Test helper — clear shared platform between vitest cases. */
export function resetRegisteredIntegrationPlatformForTests(): void {
  registeredPlatform = null;
}
