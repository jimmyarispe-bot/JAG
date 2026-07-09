import type {
  JagCapabilityBinding,
  JagHierarchyLayerKind,
  JagHierarchyNodeDefinition,
  JagHierarchyRegistrySnapshot,
} from "@/lib/platform/hierarchy/types";

const NODE_REGISTRY = new Map<string, JagHierarchyNodeDefinition>();
const CAPABILITY_REGISTRY = new Map<string, JagCapabilityBinding>();
const DUPLICATE_NODE_KEYS: string[] = [];
const DUPLICATE_CAPABILITY_KEYS: string[] = [];
let registered = false;

export function registerHierarchyNode(definition: JagHierarchyNodeDefinition): void {
  if (NODE_REGISTRY.has(definition.nodeKey)) {
    DUPLICATE_NODE_KEYS.push(definition.nodeKey);
    return;
  }
  NODE_REGISTRY.set(definition.nodeKey, definition);
}

export function registerHierarchyNodes(definitions: JagHierarchyNodeDefinition[]): void {
  for (const definition of definitions) {
    registerHierarchyNode(definition);
  }
}

export function registerCapabilityBinding(binding: JagCapabilityBinding): void {
  if (CAPABILITY_REGISTRY.has(binding.capabilityKey)) {
    DUPLICATE_CAPABILITY_KEYS.push(binding.capabilityKey);
    return;
  }
  CAPABILITY_REGISTRY.set(binding.capabilityKey, binding);
}

export function registerCapabilityBindings(bindings: JagCapabilityBinding[]): void {
  for (const binding of bindings) {
    registerCapabilityBinding(binding);
  }
}

export function getHierarchyNode(nodeKey: string): JagHierarchyNodeDefinition | undefined {
  return NODE_REGISTRY.get(nodeKey);
}

export function getAllHierarchyNodes(): JagHierarchyNodeDefinition[] {
  return [...NODE_REGISTRY.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getHierarchyNodesByKind(kind: JagHierarchyLayerKind): JagHierarchyNodeDefinition[] {
  return getAllHierarchyNodes().filter((node) => node.kind === kind);
}

export function getPublishedHierarchyNodes(): JagHierarchyNodeDefinition[] {
  return getAllHierarchyNodes().filter((node) => node.status === "published");
}

export function getCapabilityBinding(capabilityKey: string): JagCapabilityBinding | undefined {
  return CAPABILITY_REGISTRY.get(capabilityKey);
}

export function getAllCapabilityBindings(): JagCapabilityBinding[] {
  return [...CAPABILITY_REGISTRY.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isKnownHierarchyNodeKey(nodeKey: string): boolean {
  return NODE_REGISTRY.has(nodeKey);
}

export function isKnownCapabilityKey(capabilityKey: string): boolean {
  return CAPABILITY_REGISTRY.has(capabilityKey);
}

export function getHierarchyRegistrySnapshot(): JagHierarchyRegistrySnapshot {
  const kinds = new Set<JagHierarchyLayerKind>();
  for (const node of NODE_REGISTRY.values()) {
    kinds.add(node.kind);
  }
  return {
    nodes: getAllHierarchyNodes(),
    capabilityBindings: getAllCapabilityBindings(),
    layerKinds: [...kinds].sort(),
    registeredAt: new Date().toISOString(),
  };
}

export function isHierarchyRegistryRegistered(): boolean {
  return registered;
}

export function markHierarchyRegistryRegistered(): void {
  registered = true;
}

export function getDuplicateHierarchyNodeRegistrations(): string[] {
  return [...DUPLICATE_NODE_KEYS];
}

export function getDuplicateCapabilityRegistrations(): string[] {
  return [...DUPLICATE_CAPABILITY_KEYS];
}

export function clearHierarchyRegistryForTests(): void {
  NODE_REGISTRY.clear();
  CAPABILITY_REGISTRY.clear();
  DUPLICATE_NODE_KEYS.length = 0;
  DUPLICATE_CAPABILITY_KEYS.length = 0;
  registered = false;
}
