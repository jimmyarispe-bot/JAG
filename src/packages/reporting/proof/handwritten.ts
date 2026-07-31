import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { REPORTING_ENTITY_DEFINITIONS } from "@/packages/reporting/entities";
import { REPORTING_NAVIGATION } from "@/packages/reporting/navigation";
import { REPORTING_PERMISSION_PACKS } from "@/packages/reporting/permissions";
import {
  createReportingModelCompilerPorts,
  listReportingProofPermissionPacks,
} from "@/packages/reporting/proof/ports";

export function registerReportingHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createReportingModelCompilerPorts();
  for (const entity of REPORTING_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(REPORTING_NAVIGATION);
  for (const pack of REPORTING_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) =>
        REPORTING_ENTITY_DEFINITIONS.some((d) => d.entityType === t)
      )
      .sort(),
    navigationIds: [REPORTING_NAVIGATION.id],
    permissionPackIds: listReportingProofPermissionPacks().map((p) => p.id),
  };
}
