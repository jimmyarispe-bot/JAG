import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { COMMUNICATIONS_ENTITY_DEFINITIONS } from "@/packages/communications/entities";
import { COMMUNICATIONS_NAVIGATION } from "@/packages/communications/navigation";
import { COMMUNICATIONS_PERMISSION_PACKS } from "@/packages/communications/permissions";
import {
  createCommunicationsModelCompilerPorts,
  listCommunicationsProofPermissionPacks,
} from "@/packages/communications/proof/ports";

export function registerCommunicationsHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createCommunicationsModelCompilerPorts();
  for (const entity of COMMUNICATIONS_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(COMMUNICATIONS_NAVIGATION);
  for (const pack of COMMUNICATIONS_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        COMMUNICATIONS_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [COMMUNICATIONS_NAVIGATION.id],
    permissionPackIds: listCommunicationsProofPermissionPacks().map((p) => p.id),
  };
}
