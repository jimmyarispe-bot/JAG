import type { JagCapabilityBinding, JagHierarchyNodeDefinition } from "@/lib/platform/hierarchy/types";
import { resolveWorkflowContext } from "@/lib/platform/hierarchy/query/lookup";

export interface JagHierarchyReferences {
  capabilityKey: string;
  standardKey: string;
  protocolKey: string;
  processKey: string;
  procedureKey: string;
  ruleSetKeys: string[];
  parameterKeys: string[];
  evidenceTypeKeys: string[];
  knowledgeAssetKeys: string[];
  intelligenceServiceKeys: string[];
  workflowKey?: string;
  automationKey?: string;
  decisionTypeKey?: string;
  eventType?: string;
}

/** Extract flat reference map from a capability binding. */
export function extractHierarchyReferences(binding: JagCapabilityBinding): JagHierarchyReferences {
  return {
    capabilityKey: binding.capabilityKey,
    standardKey: binding.standardKey,
    protocolKey: binding.protocolKey,
    processKey: binding.processKey,
    procedureKey: binding.procedureKey,
    ruleSetKeys: binding.ruleSetKeys,
    parameterKeys: binding.parameterKeys,
    evidenceTypeKeys: binding.evidenceTypeKeys,
    knowledgeAssetKeys: binding.knowledgeAssetKeys,
    intelligenceServiceKeys: binding.intelligenceServiceKeys,
    workflowKey: binding.workflowKey,
    automationKey: binding.automationKey,
    decisionTypeKey: binding.decisionTypeKey,
    eventType: binding.eventType,
  };
}

/** Resolve all hierarchy references for a capability — used by workflows and modules. */
export function resolveHierarchyReferences(capabilityKey: string): JagHierarchyReferences | null {
  const ctx = resolveWorkflowContext(capabilityKey);
  if (!ctx) return null;

  const binding = {
    capabilityKey: ctx.capabilityKey,
    standardKey: ctx.governance.standard?.nodeKey ?? "",
    protocolKey: ctx.governance.protocol?.nodeKey ?? "",
    processKey: ctx.governance.process?.nodeKey ?? "",
    procedureKey: ctx.governance.procedure?.nodeKey ?? "",
    ruleSetKeys: ctx.ruleSetKeys,
    parameterKeys: ctx.parameterKeys,
    evidenceTypeKeys: ctx.evidenceTypeKeys,
    knowledgeAssetKeys: ctx.knowledgeAssetKeys,
    intelligenceServiceKeys: ctx.intelligenceServiceKeys,
    workflowKey: ctx.workflowKey,
    automationKey: ctx.automationKey,
    decisionTypeKey: ctx.decisionTypeKey,
    eventType: ctx.eventType,
  } as JagCapabilityBinding;

  return extractHierarchyReferences(binding);
}

/** Attach hierarchy reference metadata to a platform payload. */
export function withHierarchyReferences<T extends Record<string, unknown>>(
  capabilityKey: string,
  payload: T
): T & { hierarchy: JagHierarchyReferences | null } {
  return {
    ...payload,
    hierarchy: resolveHierarchyReferences(capabilityKey),
  };
}

/** Resolve parameter defaults from hierarchy parameter nodes. */
export function resolveParameterDefaults(
  parameterKeys: string[],
  nodes: JagHierarchyNodeDefinition[]
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const key of parameterKeys) {
    const node = nodes.find((n) => n.nodeKey === key);
    if (node?.metadata?.defaultValue !== undefined) {
      defaults[key] = node.metadata.defaultValue;
    }
  }
  return defaults;
}
