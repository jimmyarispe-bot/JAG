import { ACADEMICS_SCHEMAS } from "@/applications/academyos/schemas/academics";
import { FINANCE_COMMS_SCHEMAS } from "@/applications/academyos/schemas/finance-comms";
import { ORG_STRUCTURE_SCHEMAS } from "@/applications/academyos/schemas/org-structure";
import { PEOPLE_SCHEMAS } from "@/applications/academyos/schemas/people";
import { SERVICES_SCHEMAS } from "@/applications/academyos/schemas/services";
import type { PlatformSchema } from "@/lib/platform/schema";

/** Complete AcademyOS domain schemas (Phase 1 foundation). */
export const ACADEMYOS_SCHEMAS: PlatformSchema[] = [
  ...ORG_STRUCTURE_SCHEMAS,
  ...PEOPLE_SCHEMAS,
  ...ACADEMICS_SCHEMAS,
  ...SERVICES_SCHEMAS,
  ...FINANCE_COMMS_SCHEMAS,
];

export const ACADEMYOS_ENTITY_TYPES = ACADEMYOS_SCHEMAS.map((s) => s.entityType);
