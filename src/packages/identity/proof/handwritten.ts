/**
 * Handwritten baseline for equivalence — same contributions as identity.core,
 * registered directly (not used in production path).
 */

import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { IDENTITY_ENTITY_DEFINITIONS } from "@/packages/identity/entities";
import { IDENTITY_NAVIGATION } from "@/packages/identity/navigation";
import {
  createIdentityModelCompilerPorts,
  listIdentityProofPermissionPacks,
} from "@/packages/identity/proof/ports";
import { IDENTITY_PERMISSION_PACKS } from "@/packages/identity/permissions";

export function registerIdentityHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createIdentityModelCompilerPorts();
  for (const entity of IDENTITY_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(IDENTITY_NAVIGATION);
  for (const pack of IDENTITY_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        IDENTITY_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [IDENTITY_NAVIGATION.id],
    permissionPackIds: listIdentityProofPermissionPacks().map((p) => p.id),
  };
}
