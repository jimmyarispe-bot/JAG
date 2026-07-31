/** QuickBooks Online Connector™ — domain types. */

export const QBO_CONNECTOR_ID = "quickbooks-online" as const;

export const QBO_REPORT_TYPES = [
  "ProfitAndLoss",
  "BalanceSheet",
  "CashFlow",
  "TrialBalance",
  "AccountList",
] as const;

export type QboReportType = (typeof QBO_REPORT_TYPES)[number];

export const QBO_REPORT_LABELS: Readonly<Record<QboReportType, string>> = {
  ProfitAndLoss: "Profit & Loss",
  BalanceSheet: "Balance Sheet",
  CashFlow: "Cash Flow Statement",
  TrialBalance: "Trial Balance",
  AccountList: "Chart of Accounts",
};

export type QboTokenBundle = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly realmId: string;
  readonly companyName: string;
  readonly environment: "sandbox" | "production";
  readonly demo?: boolean;
};

export type QboReportPayload = {
  readonly reportType: QboReportType;
  readonly reportName: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly periodLabel: string;
  readonly generatedAt: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly summary?: Readonly<Record<string, number | string>>;
};

export type QboSyncFailureCode =
  | "expired_token"
  | "revoked_authorization"
  | "rate_limited"
  | "network_failure"
  | "invalid_response"
  | "not_connected"
  | "unknown";

export type QboConnectorError = {
  readonly code: QboSyncFailureCode;
  readonly message: string;
  readonly retryable: boolean;
};
