import {
  getCapabilityBinding,
  getHierarchyNode,
  getHierarchyNodesByKind,
  getPublishedHierarchyNodes,
} from "@/lib/platform/hierarchy/registry/registry";
import type {
  JagGovernanceChain,
  JagHierarchyNodeDefinition,
  JagHierarchyTreeNode,
  JagWorkflowContext,
} from "@/lib/platform/hierarchy/types";

export function lookupHierarchyNode(nodeKey: string): JagHierarchyNodeDefinition | undefined {
  return getHierarchyNode(nodeKey);
}

export function lookupNodesByKind(kind: JagHierarchyNodeDefinition["kind"]): JagHierarchyNodeDefinition[] {
  return getHierarchyNodesByKind(kind);
}

/** Walk parent chain from any node to root. */
export function lookupAncestorChain(nodeKey: string): JagHierarchyNodeDefinition[] {
  const chain: JagHierarchyNodeDefinition[] = [];
  let current = getHierarchyNode(nodeKey);
  const visited = new Set<string>();

  while (current && !visited.has(current.nodeKey)) {
    visited.add(current.nodeKey);
    chain.unshift(current);
    current = current.parentKey ? getHierarchyNode(current.parentKey) : undefined;
  }

  return chain;
}

/** Resolve standard → protocol → process → procedure from a procedure key. */
export function lookupGovernanceChain(procedureKey: string): JagGovernanceChain {
  const procedure = getHierarchyNode(procedureKey);
  if (!procedure || procedure.kind !== "procedure") {
    return {};
  }

  const chain = lookupAncestorChain(procedureKey);
  const byKind = (kind: JagHierarchyNodeDefinition["kind"]) =>
    chain.find((n) => n.kind === kind);

  return {
    standard: byKind("standard"),
    protocol: byKind("protocol"),
    process: byKind("process"),
    procedure,
  };
}

function findFoundationNodes(): JagWorkflowContext["foundation"] {
  const vision = getHierarchyNodesByKind("vision").find((n) => n.status === "published");
  const mission = getHierarchyNodesByKind("mission").find((n) => n.status === "published");
  const coreValues = getHierarchyNodesByKind("core_values").filter((n) => n.status === "published");
  const jagWay = getHierarchyNodesByKind("jag_way").find((n) => n.status === "published");
  return { vision, mission, coreValues, jagWay };
}

/** Resolve full workflow context for an executable capability. */
export function resolveWorkflowContext(capabilityKey: string): JagWorkflowContext | null {
  const binding = getCapabilityBinding(capabilityKey);
  if (!binding || binding.status !== "published") return null;

  const governance = lookupGovernanceChain(binding.procedureKey);
  const resolvedKeys = new Set<string>([
    binding.standardKey,
    binding.protocolKey,
    binding.processKey,
    binding.procedureKey,
    ...binding.parameterKeys,
    ...binding.evidenceTypeKeys,
    ...binding.knowledgeAssetKeys,
  ]);

  const foundation = findFoundationNodes();
  for (const node of [...lookupAncestorChain(binding.standardKey), ...getPublishedHierarchyNodes()]) {
    if (node.kind === "vision" || node.kind === "mission" || node.kind === "jag_way") {
      resolvedKeys.add(node.nodeKey);
    }
  }

  const resolvedNodes = [...resolvedKeys]
    .map((key) => getHierarchyNode(key))
    .filter((n): n is JagHierarchyNodeDefinition => Boolean(n));

  return {
    capabilityKey: binding.capabilityKey,
    capabilityTitle: binding.title,
    foundation,
    governance,
    ruleSetKeys: binding.ruleSetKeys,
    parameterKeys: binding.parameterKeys,
    evidenceTypeKeys: binding.evidenceTypeKeys,
    knowledgeAssetKeys: binding.knowledgeAssetKeys,
    intelligenceServiceKeys: binding.intelligenceServiceKeys,
    workflowKey: binding.workflowKey,
    automationKey: binding.automationKey,
    decisionTypeKey: binding.decisionTypeKey,
    eventType: binding.eventType,
    resolvedNodes,
  };
}

/** Build hierarchy tree from a root node key (defaults to vision). */
export function buildHierarchyTree(rootKey?: string): JagHierarchyTreeNode | null {
  const root =
    (rootKey ? getHierarchyNode(rootKey) : getHierarchyNodesByKind("vision")[0]) ?? null;
  if (!root) return null;

  function build(node: JagHierarchyNodeDefinition): JagHierarchyTreeNode {
    const children = getPublishedHierarchyNodes()
      .filter((n) => n.parentKey === node.nodeKey)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(build);

    return {
      nodeKey: node.nodeKey,
      kind: node.kind,
      title: node.title,
      status: node.status,
      children,
    };
  }

  return build(root);
}

/** Which standard governs a capability. */
export function lookupGoverningStandard(capabilityKey: string): JagHierarchyNodeDefinition | undefined {
  return resolveWorkflowContext(capabilityKey)?.governance.standard;
}

/** Which protocol governs a capability. */
export function lookupGoverningProtocol(capabilityKey: string): JagHierarchyNodeDefinition | undefined {
  return resolveWorkflowContext(capabilityKey)?.governance.protocol;
}

/** Which process a capability belongs to. */
export function lookupOwningProcess(capabilityKey: string): JagHierarchyNodeDefinition | undefined {
  return resolveWorkflowContext(capabilityKey)?.governance.process;
}

/** Which procedure executes a capability. */
export function lookupExecutingProcedure(capabilityKey: string): JagHierarchyNodeDefinition | undefined {
  return resolveWorkflowContext(capabilityKey)?.governance.procedure;
}
