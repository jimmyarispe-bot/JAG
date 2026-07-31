import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { SCHEDULING_ENTITY_DEFINITIONS } from "@/packages/scheduling/entities";
import { SCHEDULING_NAVIGATION } from "@/packages/scheduling/navigation";
import { SCHEDULING_PERMISSION_PACKS } from "@/packages/scheduling/permissions";
import {
  createSchedulingModelCompilerPorts,
  listSchedulingProofPermissionPacks,
} from "@/packages/scheduling/proof/ports";

export function registerSchedulingHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createSchedulingModelCompilerPorts();
  for (const entity of SCHEDULING_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(SCHEDULING_NAVIGATION);
  for (const pack of SCHEDULING_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        SCHEDULING_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [SCHEDULING_NAVIGATION.id],
    permissionPackIds: listSchedulingProofPermissionPacks().map((p) => p.id),
  };
}
