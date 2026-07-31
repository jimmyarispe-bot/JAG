import { EntityService } from "@/jag/entities";
import { registerPackageNavigation } from "@/jag/navigation";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { POLICY_ENTITY_DEFINITIONS } from "@/packages/policy/entities";
import { POLICY_NAVIGATION } from "@/packages/policy/navigation";
import { POLICY_PERMISSION_PACKS } from "@/packages/policy/permissions";
import {
  createPolicyModelCompilerPorts,
  listPolicyProofPermissionPacks,
} from "@/packages/policy/proof/ports";

export function registerPolicyHandwrittenBaseline(): {
  entities: string[];
  navigationIds: string[];
  permissionPackIds: string[];
} {
  const ports = createPolicyModelCompilerPorts();
  for (const entity of POLICY_ENTITY_DEFINITIONS) {
    if (!EntityService.isRegistered(entity.entityType)) {
      EntityService.registerType(entity as unknown as EntityTypeDefinition);
    }
  }
  registerPackageNavigation(POLICY_NAVIGATION);
  for (const pack of POLICY_PERMISSION_PACKS) {
    ports.registerPermissionPack?.(pack);
  }

  return {
    entities: EntityService.listTypes()
      .map((e) => e.entityType)
      .filter((t) => POLICY_ENTITY_DEFINITIONS.some((d) => d.entityType === t))
      .sort(),
    navigationIds: [POLICY_NAVIGATION.id],
    permissionPackIds: listPolicyProofPermissionPacks().map((p) => p.id),
  };
}
