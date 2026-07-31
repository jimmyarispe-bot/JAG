import { ACADEMYOS_SCHEMAS } from "@/applications/academyos/schemas/definitions";
import { SchemaService } from "@/lib/platform/schema";
import type { PlatformSchema } from "@/lib/platform/schema";

export function registerAcademySchemas(): PlatformSchema[] {
  return ACADEMYOS_SCHEMAS.map((schema) => SchemaService.register(schema));
}

export { ACADEMYOS_SCHEMAS, ACADEMYOS_ENTITY_TYPES } from "@/applications/academyos/schemas/definitions";
