import { registerAcademyApis } from "@/applications/academyos/api";
import { registerAcademyDashboards } from "@/applications/academyos/dashboards";
import { registerAcademyEntities } from "@/applications/academyos/entities";
import { registerAcademyForms } from "@/applications/academyos/forms";
import { registerAcademyIntelligence } from "@/applications/academyos/intelligence";
import { AcademyOSManifest } from "@/applications/academyos/manifest";
import { registerAcademyNavigation } from "@/applications/academyos/navigation";
import { registerAcademyPermissions } from "@/applications/academyos/permissions";
import { registerAcademyReports } from "@/applications/academyos/reports";
import { registerAcademySchemas } from "@/applications/academyos/schemas";
import { registerAcademySeed } from "@/applications/academyos/seed";
import { registerAcademyWorkflows } from "@/applications/academyos/workflows";
import { GraphService } from "@/lib/platform/graph";
import { SdkService } from "@/lib/platform/sdk";

export type AcademyBootstrapResult = {
  applicationId: string;
  schemaCount: number;
  entityCount: number;
  formCount: number;
  workflowCount: number;
  apiCount: number;
  permissionRoleCount: number;
  navigationItems: number;
  reportCount: number;
  dashboardCount: number;
  intelligencePackCount: number;
  graphNodes: number;
};

/**
 * AcademyOS bootstrap — registration only.
 *
 * Order notes:
 * - Workflows register before schemas because schemas may reference workflow ids.
 * - Remaining steps follow the Stage 1 contract: SDK → domain → surface configs.
 */
export function bootstrapAcademyOS(): AcademyBootstrapResult {
  SdkService.register(AcademyOSManifest);
  if (SdkService.get(AcademyOSManifest.id)?.state === "installed") {
    SdkService.validateApp(AcademyOSManifest.id);
  }
  if (SdkService.get(AcademyOSManifest.id)?.state === "validated") {
    SdkService.enable(AcademyOSManifest.id);
  }

  const workflows = registerAcademyWorkflows();
  const schemas = registerAcademySchemas();
  const entities = registerAcademyEntities();
  const forms = registerAcademyForms();
  const permissionRoles = registerAcademyPermissions();
  const apis = registerAcademyApis();
  const navigation = registerAcademyNavigation();
  const reports = registerAcademyReports();
  const dashboards = registerAcademyDashboards();
  const intelligence = registerAcademyIntelligence();
  registerAcademySeed();

  const graph = GraphService.rebuild();

  return {
    applicationId: AcademyOSManifest.id,
    schemaCount: schemas.length,
    entityCount: entities.length,
    formCount: forms.length,
    workflowCount: workflows.length,
    apiCount: apis.length,
    permissionRoleCount: permissionRoles.length,
    navigationItems: navigation.items.length,
    reportCount: reports.length,
    dashboardCount: dashboards.length,
    intelligencePackCount: intelligence.length,
    graphNodes: graph.nodes,
  };
}
