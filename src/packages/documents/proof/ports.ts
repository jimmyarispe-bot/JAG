import type { ApplicationModelCompilerPorts } from "@/jag/modeling";
import type { PermissionModel } from "@/jag/modeling";

const permissionPacks = new Map<string, PermissionModel>();

export function resetDocumentsProofPortsForTests(): void {
  permissionPacks.clear();
}

export function listDocumentsProofPermissionPacks(): PermissionModel[] {
  return [...permissionPacks.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function createDocumentsModelCompilerPorts(): ApplicationModelCompilerPorts {
  return {
    registerPermissionPack(pack) {
      permissionPacks.set(pack.id, pack);
    },
  };
}
