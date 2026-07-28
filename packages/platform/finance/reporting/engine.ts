/**
 * FinancialReportingEngine — consumes FinanceEngine ledger/AP/AR/treasury.
 * No AI CFO, no EBITDA calculations (placeholder only).
 */

import {
  listEvidenceRecords,
  listMemoryRecords,
  listOperationalEvents,
  listTwinProjections,
  OPERATIONAL_SINKS,
} from "../operations/events";
import { buildReportingDashboard } from "./dashboards";
import {
  defineDimension,
  listDimensionValues,
  listDimensions,
  listTags,
  setDimensionValue,
  tagRecord,
} from "./dimensions";
import { buildExecutiveKpis } from "./executive-kpis";
import { exportReport } from "./exports";
import {
  generateStatement,
  trialBalance,
  computeAccountBalances,
} from "./financial-statements";
import { buildFinanceDashboard, trialBalanceHint } from "./foundation";
import { reportByScope } from "./general-reporting";
import {
  getStatement,
  listDashboards,
  listExports,
  listStatements,
  listVariances,
} from "./store";
import { REPORTING_GUARDS } from "./types";
import { computeVariance } from "./variance";

export class FinancialReportingEngine {
  readonly guards = REPORTING_GUARDS;
  readonly sinks = OPERATIONAL_SINKS;

  // Foundation (P-008)
  foundationDashboard = buildFinanceDashboard;
  trialBalanceHint = trialBalanceHint;

  // Dimensions
  defineDimension = defineDimension;
  setDimensionValue = setDimensionValue;
  tagRecord = tagRecord;
  listDimensions = listDimensions;
  listDimensionValues = listDimensionValues;
  listTags = listTags;

  // Statements
  generateStatement = generateStatement;
  trialBalance = trialBalance;
  computeAccountBalances = computeAccountBalances;
  reportByScope = reportByScope;
  listStatements = listStatements;
  getStatement = getStatement;

  // Variance / KPIs / dashboards
  computeVariance = computeVariance;
  listVariances = listVariances;
  buildExecutiveKpis = buildExecutiveKpis;
  buildDashboard = buildReportingDashboard;
  listDashboards = listDashboards;

  // Exports
  exportReport = exportReport;
  listExports = listExports;

  // OIOS
  listOperationalEvents = listOperationalEvents;
  listTwinProjections = listTwinProjections;
  listEvidenceRecords = listEvidenceRecords;
  listMemoryRecords = listMemoryRecords;
}

export function createFinancialReportingEngine(): FinancialReportingEngine {
  return new FinancialReportingEngine();
}
