/**
 * ECC helper — Square ↔ QuickBooks reconciliation for brief / risk / finance surfaces.
 */

import { reconcileSquareQuickBooks } from "@/lib/platform/integrations/connectors/square/reconciliation";
import type { SquareQuickBooksReconciliation } from "@/lib/platform/integrations/connectors/square/reconciliation";
import { DEMO_EXEC_ORGANIZATION_ID } from "@/lib/exec/scope";

export type { SquareQuickBooksReconciliation };

export function resolveSquareQuickBooksReconciliation(
  organizationId: string = DEMO_EXEC_ORGANIZATION_ID
): SquareQuickBooksReconciliation {
  return reconcileSquareQuickBooks(organizationId);
}
