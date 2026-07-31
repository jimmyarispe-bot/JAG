import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { DOCUMENTS_ENTITY_DEFINITIONS } from "@/packages/documents/entities";
import { DOCUMENTS_NAVIGATION } from "@/packages/documents/navigation";
import { DOCUMENTS_PERMISSION_PACKS } from "@/packages/documents/permissions";
import {
  createDocumentsModelCompilerPorts,
  listDocumentsProofPermissionPacks,
} from "@/packages/documents/proof/ports";

export function registerDocumentsHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createDocumentsModelCompilerPorts();
  for (const entity of DOCUMENTS_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(DOCUMENTS_NAVIGATION);
  for (const pack of DOCUMENTS_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        DOCUMENTS_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [DOCUMENTS_NAVIGATION.id],
    permissionPackIds: listDocumentsProofPermissionPacks().map((p) => p.id),
  };
}
