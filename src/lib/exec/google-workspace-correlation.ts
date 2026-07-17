/**
 * ECC helper — Google Workspace ↔ AcademyOS / QB / Square / Plaid correlation.
 */

import { correlateGoogleWorkspace } from "@/lib/platform/integrations/connectors/google-workspace/correlation";
import type { GoogleWorkspaceCorrelation } from "@/lib/platform/integrations/connectors/google-workspace/correlation";
import { DEFAULT_EXEC_SCOPE } from "@/lib/exec/intelligence";

export type { GoogleWorkspaceCorrelation };

export function resolveGoogleWorkspaceCorrelation(
  organizationId: string = DEFAULT_EXEC_SCOPE.organizationId
): GoogleWorkspaceCorrelation {
  return correlateGoogleWorkspace(organizationId);
}
