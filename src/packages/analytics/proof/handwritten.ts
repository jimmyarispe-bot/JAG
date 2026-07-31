import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { ANALYTICS_ENTITY_DEFINITIONS } from "@/packages/analytics/entities";
import { ANALYTICS_NAVIGATION } from "@/packages/analytics/navigation";
import { ANALYTICS_PERMISSION_PACKS } from "@/packages/analytics/permissions";
import {
  createAnalyticsModelCompilerPorts,
  listAnalyticsProofPermissionPacks,
} from "@/packages/analytics/proof/ports";

export function registerAnalyticsHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createAnalyticsModelCompilerPorts();
  for (const entity of ANALYTICS_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(ANALYTICS_NAVIGATION);
  for (const pack of ANALYTICS_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        ANALYTICS_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [ANALYTICS_NAVIGATION.id],
    permissionPackIds: listAnalyticsProofPermissionPacks().map((p) => p.id),
  };
}
