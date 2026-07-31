import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { WORK_ENTITY_DEFINITIONS } from "@/packages/work/entities";
import { WORK_NAVIGATION } from "@/packages/work/navigation";
import { WORK_PERMISSION_PACKS } from "@/packages/work/permissions";
import {
  createWorkModelCompilerPorts,
  listWorkProofPermissionPacks,
} from "@/packages/work/proof/ports";

export function registerWorkHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createWorkModelCompilerPorts();
  for (const entity of WORK_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(WORK_NAVIGATION);
  for (const pack of WORK_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) => WORK_ENTITY_DEFINITIONS.some((d) => d.entityType === t))
      .sort(),
    navigationIds: [WORK_NAVIGATION.id],
    permissionPackIds: listWorkProofPermissionPacks().map((p) => p.id),
  };
}
