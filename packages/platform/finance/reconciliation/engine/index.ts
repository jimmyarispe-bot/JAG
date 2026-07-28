/**
 * ReconciliationEngine — JAG Reconciliation™ orchestrator (P-010).
 *
 * Not AI CFO. Not forecasting. Not financial statements. Not EBITDA.
 */

import { reconciliationAnalytics } from "../analytics";
import {
  approveReconciliation,
  canApproveStage,
  listApprovals,
  STAGE_ORDER,
} from "../approvals";
import {
  describeDigitalTwinSignals,
  listSignals,
  publishReconciliationSignal,
  subscribeSignals,
} from "../events";
import {
  createException,
  listExceptions,
  resolveException,
} from "../exceptions";
import { listHistory } from "../history";
import { listAdjustments, listMatches } from "../store";
import {
  attachStatementImport,
  getPeriod,
  listPeriods,
  openReconciliationPeriod,
} from "../periods";
import { getMatchingRules, setMatchingRules } from "../rules";
import { listSuggestions, refreshSuggestions } from "../suggestions";
import { RECONCILIATION_GUARDS } from "../types";
import {
  acceptSuggestedMatch,
  closePeriod,
  finalizePeriod,
  manualMatch,
  postAdjustment,
  reopenPeriod,
  runAutomaticMatching,
} from "../workflows";

export class ReconciliationEngine {
  readonly guards = RECONCILIATION_GUARDS;
  readonly approvalStages = STAGE_ORDER;
  readonly digitalTwin = describeDigitalTwinSignals();

  // Periods / workflow
  openPeriod = openReconciliationPeriod;
  attachStatement = attachStatementImport;
  listPeriods = listPeriods;
  getPeriod = getPeriod;
  runAutoMatch = runAutomaticMatching;
  refreshSuggestions = refreshSuggestions;
  listSuggestions = listSuggestions;
  acceptSuggestion = acceptSuggestedMatch;
  manualMatch = manualMatch;
  postAdjustment = postAdjustment;
  finalize = finalizePeriod;
  close = closePeriod;
  reopen = reopenPeriod;

  // Exceptions / approvals / history
  createException = createException;
  resolveException = resolveException;
  listExceptions = listExceptions;
  approve = approveReconciliation;
  canApprove = canApproveStage;
  listApprovals = listApprovals;
  listMatches = listMatches;
  listAdjustments = listAdjustments;
  listHistory = listHistory;
  analytics = reconciliationAnalytics;

  // Rules / signals
  getMatchingRules = getMatchingRules;
  setMatchingRules = setMatchingRules;
  listSignals = listSignals;
  subscribeSignals = subscribeSignals;
  publishSignal = publishReconciliationSignal;

  bootstrapPeriod(input: {
    organizationId: string;
    userId: string;
    bankAccountId: string;
    periodKey: string;
    statementBalance: number;
    bookBalance?: number;
    runAutoMatch?: boolean;
  }) {
    const period = this.openPeriod({
      organizationId: input.organizationId,
      userId: input.userId,
      bankAccountId: input.bankAccountId,
      periodKey: input.periodKey,
      statementBalance: input.statementBalance,
      bookBalance: input.bookBalance,
      cadence: "monthly",
    });
    if ("error" in period) return period;
    if (input.runAutoMatch === false) {
      return {
        period,
        auto: null,
        analytics: this.analytics(input.organizationId),
      };
    }
    const auto = this.runAutoMatch({
      organizationId: input.organizationId,
      userId: input.userId,
      periodId: period.id,
    });
    if ("error" in auto) {
      return {
        period,
        auto,
        analytics: this.analytics(input.organizationId),
      };
    }
    return {
      period: auto.period,
      auto,
      analytics: this.analytics(input.organizationId),
      guards: this.guards,
      digitalTwin: this.digitalTwin,
    };
  }
}

export function createReconciliationEngine(): ReconciliationEngine {
  return new ReconciliationEngine();
}
