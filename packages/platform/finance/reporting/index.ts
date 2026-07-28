/**
 * P-012 — Financial reporting (consumes FinanceEngine; no AI CFO).
 */

export { REPORTING_GUARDS } from "./types";
export type {
  DimensionDefinition,
  DimensionTag,
  DimensionValue,
  ExecutiveKpis,
  ExportFormat,
  FinancialStatement,
  ReportExport,
  ReportScope,
  ReportingDashboard,
  StatementKind,
  StatementLine,
  VarianceReport,
} from "./types";

export {
  buildFinanceDashboard,
  trialBalanceHint,
} from "./foundation";

export {
  FinancialReportingEngine,
  createFinancialReportingEngine,
} from "./engine";

export { resetReportingStoreForTests } from "./store";
export {
  defineDimension,
  setDimensionValue,
  tagRecord,
  listDimensions,
  listDimensionValues,
} from "./dimensions";
export {
  generateStatement,
  trialBalance,
  computeAccountBalances,
} from "./financial-statements";
export { computeVariance } from "./variance";
export { buildExecutiveKpis } from "./executive-kpis";
export { buildReportingDashboard } from "./dashboards";
export { exportReport } from "./exports";
export { reportByScope } from "./general-reporting";
