/**
 * ECC helper — Square ↔ QuickBooks reconciliation for brief / risk / finance surfaces.
 */

import { reconcileSquareQuickBooks } from "@/lib/platform/integrations/connectors/square/reconciliation";
import type { SquareQuickBooksReconciliation } from "@/lib/platform/integrations/connectors/square/reconciliation";
import { DEFAULT_EXEC_SCOPE } from "@/lib/exec/intelligence";

export type { SquareQuickBooksReconciliation };

export function resolveSquareQuickBooksReconciliation(
  organizationId: string = DEFAULT_EXEC_SCOPE.organizationId
): SquareQuickBooksReconciliation {
  return reconcileSquareQuickBooks(organizationId);
}
