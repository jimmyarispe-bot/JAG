/**
 * ECC helper — Plaid ↔ Square ↔ QuickBooks cash reconciliation.
 */

import { reconcilePlaidCash } from "@/lib/platform/integrations/connectors/plaid/reconciliation";
import type { PlaidCashReconciliation } from "@/lib/platform/integrations/connectors/plaid/reconciliation";
import { DEFAULT_EXEC_SCOPE } from "@/lib/exec/intelligence";

export type { PlaidCashReconciliation };

export function resolvePlaidCashReconciliation(
  organizationId: string = DEFAULT_EXEC_SCOPE.organizationId
): PlaidCashReconciliation {
  return reconcilePlaidCash(organizationId);
}
