/**
 * ECC helper — Google Workspace ↔ AcademyOS / QB / Square / Plaid correlation.
 */

import { correlateGoogleWorkspace } from "@/lib/platform/integrations/connectors/google-workspace/correlation";
import type { GoogleWorkspaceCorrelation } from "@/lib/platform/integrations/connectors/google-workspace/correlation";
import { DEMO_EXEC_ORGANIZATION_ID } from "@/lib/exec/scope";

export type { GoogleWorkspaceCorrelation };

export function resolveGoogleWorkspaceCorrelation(
  organizationId: string = DEMO_EXEC_ORGANIZATION_ID
): GoogleWorkspaceCorrelation {
  return correlateGoogleWorkspace(organizationId);
}
