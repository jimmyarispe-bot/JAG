import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { DECISION_ENTITY_DEFINITIONS } from "@/packages/decision/entities";
import { DECISION_NAVIGATION } from "@/packages/decision/navigation";
import { DECISION_PERMISSION_PACKS } from "@/packages/decision/permissions";
import {
  createDecisionModelCompilerPorts,
  listDecisionProofPermissionPacks,
} from "@/packages/decision/proof/ports";

export function registerDecisionHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createDecisionModelCompilerPorts();
  for (const entity of DECISION_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(DECISION_NAVIGATION);
  for (const pack of DECISION_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        DECISION_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [DECISION_NAVIGATION.id],
    permissionPackIds: listDecisionProofPermissionPacks().map((p) => p.id),
  };
}
