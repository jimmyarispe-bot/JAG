import type { ApplicationModelCompilerPorts } from "@/jag/modeling";
import type { PermissionModel } from "@/jag/modeling";

const permissionPacks = new Map<string, PermissionModel>();

export function resetWorkProofPortsForTests(): void {
  permissionPacks.clear();
}

export function listWorkProofPermissionPacks(): PermissionModel[] {
  return [...permissionPacks.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function createWorkModelCompilerPorts(): ApplicationModelCompilerPorts {
  return {
    registerPermissionPack(pack) {
      permissionPacks.set(pack.id, pack);
    },
  };
}
