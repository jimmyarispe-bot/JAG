import type { ApplicationModelCompilerPorts } from "@/jag/modeling";
import type { PermissionModel } from "@/jag/modeling";

const permissionPacks = new Map<string, PermissionModel>();

export function resetPolicyProofPortsForTests(): void {
  permissionPacks.clear();
}

export function listPolicyProofPermissionPacks(): PermissionModel[] {
  return [...permissionPacks.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function createPolicyModelCompilerPorts(): ApplicationModelCompilerPorts {
  return {
    registerPermissionPack(pack) {
      permissionPacks.set(pack.id, pack);
    },
  };
}
