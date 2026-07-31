import { ACADEMYOS_SCHEMAS } from "@/applications/academyos/schemas/definitions";
import { EntityService } from "@/lib/platform/entities";
import type { EntityTypeDefinition } from "@/lib/platform/entities";
import { SchemaService } from "@/lib/platform/schema";

/**
 * Map each AcademyOS schema into the Entity Framework.
 * Prefer schema projection; fall back to explicit registerType.
 */
export function registerAcademyEntities(): EntityTypeDefinition[] {
  const registered: EntityTypeDefinition[] = [];
  for (const schema of ACADEMYOS_SCHEMAS) {
    const projected = SchemaService.projectEntity(schema);
    registered.push(EntityService.registerType(projected));
  }
  return registered;
}
