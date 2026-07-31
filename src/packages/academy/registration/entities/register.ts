import { registerAcademyEntities } from "@/applications/academyos/entities";
import { registerAcademySchemas } from "@/applications/academyos/schemas";

/**
 * Register Academy entity types into JAG Entity Framework.
 * Schemas are a prerequisite projection step (not a PackageContributionKind).
 */
export function registerAcademyPackageEntities(): void {
  registerAcademySchemas();
  registerAcademyEntities();
}
