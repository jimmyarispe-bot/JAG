/**
 * ECC helper — Plaid ↔ Square ↔ QuickBooks cash reconciliation.
 */

import { reconcilePlaidCash } from "@/lib/platform/integrations/connectors/plaid/reconciliation";
import type { PlaidCashReconciliation } from "@/lib/platform/integrations/connectors/plaid/reconciliation";
import { DEMO_EXEC_ORGANIZATION_ID } from "@/lib/exec/scope";

export type { PlaidCashReconciliation };

export function resolvePlaidCashReconciliation(
  organizationId: string = DEMO_EXEC_ORGANIZATION_ID
): PlaidCashReconciliation {
  return reconcilePlaidCash(organizationId);
}
