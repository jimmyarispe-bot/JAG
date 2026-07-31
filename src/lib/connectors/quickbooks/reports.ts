/**
 * QuickBooks financial report fetch — demo store + live Reports API.
 */

import { classifyQboHttpError, classifyThrownError, qboError } from "@/lib/connectors/quickbooks/errors";
import type {
  QboReportPayload,
  QboReportType,
  QboTokenBundle,
} from "@/lib/connectors/quickbooks/types";
import { QBO_REPORT_LABELS, QBO_REPORT_TYPES } from "@/lib/connectors/quickbooks/types";

function demoReport(
  reportType: QboReportType,
  tokens: QboTokenBundle,
  periodLabel: string
): QboReportPayload {
  const generatedAt = new Date().toISOString();
  const base = {
    reportType,
    reportName: QBO_REPORT_LABELS[reportType],
    companyId: tokens.realmId,
    companyName: tokens.companyName,
    periodLabel,
    generatedAt,
  };

  switch (reportType) {
    case "ProfitAndLoss":
      return {
        ...base,
        rows: [
          { section: "Income", account: "Tuition Revenue", amount: 842000 },
          { section: "Expense", account: "Payroll Expense", amount: 510000 },
          { section: "Expense", account: "Facilities", amount: 96000 },
        ],
        summary: { netIncome: 236000, currency: "USD" },
      };
    case "BalanceSheet":
      return {
        ...base,
        rows: [
          { section: "Assets", account: "Operating Checking", amount: 412500 },
          { section: "Assets", account: "Accounts Receivable", amount: 186400 },
          { section: "Liabilities", account: "Accounts Payable", amount: 64200 },
        ],
        summary: { totalAssets: 598900, totalLiabilities: 64200 },
      };
    case "CashFlow":
      return {
        ...base,
        rows: [
          { section: "Operating", label: "Net cash from operations", amount: 128000 },
          { section: "Investing", label: "Equipment purchases", amount: -22000 },
          { section: "Financing", label: "Debt service", amount: -18000 },
        ],
        summary: { netChangeInCash: 88000 },
      };
    case "TrialBalance":
      return {
        ...base,
        rows: [
          { account: "Operating Checking", debit: 412500, credit: 0 },
          { account: "Tuition Revenue", debit: 0, credit: 842000 },
          { account: "Payroll Expense", debit: 510000, credit: 0 },
        ],
        summary: { balanced: "true" },
      };
    case "AccountList":
      return {
        ...base,
        rows: [
          { id: "acc-1000", name: "Operating Checking", type: "Bank", active: true },
          { id: "acc-4000", name: "Tuition Revenue", type: "Income", active: true },
          { id: "acc-5000", name: "Payroll Expense", type: "Expense", active: true },
        ],
        summary: { accountCount: 3 },
      };
  }
}

export type FetchReportsResult =
  | { ok: true; reports: readonly QboReportPayload[] }
  | { ok: false; error: ReturnType<typeof qboError> };

export async function fetchQuickBooksReports(input: {
  tokens: QboTokenBundle;
  reportTypes?: readonly QboReportType[];
  periodLabel?: string;
  /** Injected for tests — simulate API failures. */
  fetchImpl?: typeof fetch;
  forceLive?: boolean;
}): Promise<FetchReportsResult> {
  const types = input.reportTypes ?? QBO_REPORT_TYPES;
  const periodLabel = input.periodLabel ?? currentFiscalPeriodLabel();

  if (input.tokens.demo && !input.forceLive) {
    return {
      ok: true,
      reports: types.map((t) => demoReport(t, input.tokens, periodLabel)),
    };
  }

  const fetchFn = input.fetchImpl ?? fetch;
  const base =
    input.tokens.environment === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  const reports: QboReportPayload[] = [];
  for (const reportType of types) {
    const path =
      reportType === "AccountList"
        ? `/v3/company/${input.tokens.realmId}/query?query=${encodeURIComponent("select * from Account maxresults 1000")}`
        : `/v3/company/${input.tokens.realmId}/reports/${reportType}`;
    try {
      const response = await fetchFn(`${base}${path}`, {
        headers: {
          Authorization: `Bearer ${input.tokens.accessToken}`,
          Accept: "application/json",
        },
      });
      const text = await response.text();
      if (!response.ok) {
        return { ok: false, error: classifyQboHttpError(response.status, text) };
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          ok: false,
          error: qboError("invalid_response", "QuickBooks returned non-JSON.", false),
        };
      }
      reports.push(normalizeLiveReport(reportType, parsed, input.tokens, periodLabel));
    } catch (err) {
      return { ok: false, error: classifyThrownError(err) };
    }
  }
  return { ok: true, reports };
}

function normalizeLiveReport(
  reportType: QboReportType,
  parsed: unknown,
  tokens: QboTokenBundle,
  periodLabel: string
): QboReportPayload {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(obj.Rows)
    ? (obj.Rows as Readonly<Record<string, unknown>>[])
    : Array.isArray((obj.QueryResponse as { Account?: unknown[] } | undefined)?.Account)
      ? (((obj.QueryResponse as { Account: Record<string, unknown>[] }).Account) as Readonly<
          Record<string, unknown>
        >[])
      : [{ raw: true }];

  return {
    reportType,
    reportName: QBO_REPORT_LABELS[reportType],
    companyId: tokens.realmId,
    companyName: tokens.companyName,
    periodLabel,
    generatedAt: new Date().toISOString(),
    rows,
    summary: { source: "quickbooks-live" },
  };
}

function currentFiscalPeriodLabel(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  return `FY${year}`;
}

/** Test helper — force a classified failure without network. */
export async function fetchQuickBooksReportsFailing(
  code: "rate_limited" | "network_failure" | "invalid_response"
): Promise<FetchReportsResult> {
  if (code === "rate_limited") {
    return {
      ok: false,
      error: qboError("rate_limited", "QuickBooks API rate limit reached.", true),
    };
  }
  if (code === "network_failure") {
    return {
      ok: false,
      error: qboError("network_failure", "Network failure talking to QuickBooks.", true),
    };
  }
  return {
    ok: false,
    error: qboError("invalid_response", "Invalid QuickBooks payload.", false),
  };
}
