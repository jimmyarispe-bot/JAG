/**
 * General reporting helpers — entity / consolidated / dimensional scopes.
 */

import type { ReportScope } from "../types";
import { generateStatement } from "../financial-statements";

export function reportByScope(input: {
  organizationId: string;
  userId: string;
  scope: ReportScope;
  scopeId?: string | null;
  periodKey: string;
  dimensionFilters?: Readonly<Record<string, string>>;
}) {
  return {
    incomeStatement: generateStatement({
      ...input,
      kind: "income_statement",
    }),
    balanceSheet: generateStatement({
      ...input,
      kind: "balance_sheet",
    }),
    trialBalance: generateStatement({
      ...input,
      kind: "trial_balance",
    }),
  };
}
