import {
  getAllCapabilityBindings,
  getAllHierarchyNodes,
  getHierarchyRegistrySnapshot,
  isHierarchyRegistryRegistered,
} from "@/lib/platform/hierarchy/registry/registry";
import {
  getRegisteredLayerKinds,
  validateHierarchyRegistryComplete,
} from "@/lib/platform/hierarchy/registry/validate";
import { JAG_HIERARCHY_LAYER_KINDS } from "@/lib/platform/hierarchy/types";

export interface HierarchyDiagnosticsReport {
  registered: boolean;
  nodeCount: number;
  capabilityCount: number;
  layerKindCount: number;
  expectedLayerKinds: number;
  missingLayerKinds: string[];
  validationOk: boolean;
  validationIssueCount: number;
  validationIssues: { code: string; message: string }[];
  capabilities: { key: string; title: string; procedureKey: string }[];
  snapshotAt: string;
}

export function collectHierarchyDiagnostics(): HierarchyDiagnosticsReport {
  const validation = validateHierarchyRegistryComplete();
  const registeredKinds = new Set(getRegisteredLayerKinds());
  const missingLayerKinds = JAG_HIERARCHY_LAYER_KINDS.filter((k) => !registeredKinds.has(k));
  const snapshot = getHierarchyRegistrySnapshot();

  return {
    registered: isHierarchyRegistryRegistered(),
    nodeCount: getAllHierarchyNodes().length,
    capabilityCount: getAllCapabilityBindings().length,
    layerKindCount: registeredKinds.size,
    expectedLayerKinds: JAG_HIERARCHY_LAYER_KINDS.length,
    missingLayerKinds,
    validationOk: validation.ok,
    validationIssueCount: validation.issues.length,
    validationIssues: validation.issues,
    capabilities: getAllCapabilityBindings().map((b) => ({
      key: b.capabilityKey,
      title: b.title,
      procedureKey: b.procedureKey,
    })),
    snapshotAt: snapshot.registeredAt,
  };
}
