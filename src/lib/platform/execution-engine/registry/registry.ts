import type { WorkspaceDefinition } from "@/lib/platform/execution-engine/types";

const WORKSPACE_REGISTRY = new Map<string, WorkspaceDefinition>();
const DUPLICATE_KEYS: string[] = [];
let registered = false;

export function registerWorkspaceDefinition(definition: WorkspaceDefinition): void {
  if (WORKSPACE_REGISTRY.has(definition.workspaceKey)) {
    DUPLICATE_KEYS.push(definition.workspaceKey);
    return;
  }
  WORKSPACE_REGISTRY.set(definition.workspaceKey, definition);
}

export function registerWorkspaceDefinitions(definitions: WorkspaceDefinition[]): void {
  for (const definition of definitions) {
    registerWorkspaceDefinition(definition);
  }
}

export function getWorkspaceDefinition(workspaceKey: string): WorkspaceDefinition | undefined {
  return WORKSPACE_REGISTRY.get(workspaceKey);
}

export function getAllWorkspaceDefinitions(): WorkspaceDefinition[] {
  return [...WORKSPACE_REGISTRY.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPublishedWorkspaceDefinitions(): WorkspaceDefinition[] {
  return getAllWorkspaceDefinitions().filter((w) => w.status === "published");
}

export function isKnownWorkspaceKey(workspaceKey: string): boolean {
  return WORKSPACE_REGISTRY.has(workspaceKey);
}

export function isExecutionEngineRegistered(): boolean {
  return registered;
}

export function markExecutionEngineRegistered(): void {
  registered = true;
}

export function getDuplicateWorkspaceRegistrations(): string[] {
  return [...DUPLICATE_KEYS];
}

export function clearExecutionEngineRegistryForTests(): void {
  WORKSPACE_REGISTRY.clear();
  DUPLICATE_KEYS.length = 0;
  registered = false;
}
