/**
 * Capability explorer loader — Sprint 207.
 */

import {
  CapabilityService,
  listCapabilityObservations,
  type CapabilityExplorerModel,
} from "@/lib/platform/capabilities";

export { listCapabilityObservations };

export type JagCapabilitiesWorkspaceModel = CapabilityExplorerModel & {
  readonly selectedId: string | null;
};

export function loadCapabilitiesWorkspace(options?: {
  readonly capabilityId?: string;
}): JagCapabilitiesWorkspaceModel {
  const explorer = CapabilityService.explorer();
  const selectedId =
    options?.capabilityId &&
    explorer.capabilities.some((c) => c.id === options.capabilityId)
      ? options.capabilityId
      : explorer.capabilities[0]?.id ?? null;

  return {
    ...explorer,
    selectedId,
  };
}
