/**
 * P-009 — Treasury & Banking types (operational money movement).
 * Reconciliation / forecasting / AI CFO are out of scope.
 */

import type { BankingAccountKind, CurrencyCode } from "../types";

export type ConnectionProvider =
  | "plaid"
  | "open_banking"
  | "manual"
  | "sandbox";

export type ConnectionStatus =
  | "active"
  | "pending"
  | "error"
  | "disconnected"
  | "needs_reauth";

export type BankInstitution = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly provider: ConnectionProvider;
  readonly country: string | null;
  readonly createdAt: string;
};

export type BankConnection = {
  readonly id: string;
  readonly organizationId: string;
  readonly institutionId: string;
  readonly entityId: string | null;
  readonly provider: ConnectionProvider;
  readonly status: ConnectionStatus;
  readonly externalItemId: string | null;
  readonly lastSyncedAt: string | null;
  readonly credentialRotationDueAt: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type TreasuryAccountKind =
  | BankingAccountKind
  | "checking"
  | "savings"
  | "money_market"
  | "line_of_credit"
  | "petty_cash"
  | "escrow"
  | "trust"
  | "restricted_cash";

export type BankTransactionStatus =
  | "pending"
  | "posted"
  | "voided"
  | "imported"
  | "manual"
  | "corrected"
  | "split"
  | "linked";

export type BankTransaction = {
  readonly id: string;
  readonly organizationId: string;
  readonly bankAccountId: string;
  readonly entityId: string | null;
  readonly status: BankTransactionStatus;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly direction: "in" | "out";
  readonly postedAt: string | null;
  readonly pendingAt: string | null;
  readonly description: string;
  readonly merchantName: string | null;
  readonly category: string | null;
  readonly vendorId: string | null;
  readonly customerId: string | null;
  readonly externalId: string | null;
  readonly importId: string | null;
  readonly parentTransactionId: string | null;
  readonly splitOfId: string | null;
  readonly linkedRecordType: string | null;
  readonly linkedRecordId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly correctedFromId: string | null;
};

export type StatementImportStatus =
  | "preview"
  | "validated"
  | "committed"
  | "rolled_back"
  | "failed";

export type StatementImportBatch = {
  readonly id: string;
  readonly organizationId: string;
  readonly bankAccountId: string;
  readonly format: "csv" | "ofx" | "qbo" | "excel" | "pdf";
  readonly fileName: string;
  readonly status: StatementImportStatus;
  readonly rowCount: number;
  readonly duplicateCount: number;
  readonly metadataOnly: boolean;
  readonly ocrHookReady: boolean;
  readonly previewRows: readonly {
    externalId: string;
    amount: number;
    description: string;
    date: string;
  }[];
  readonly createdAt: string;
  readonly createdBy: string;
  readonly committedAt: string | null;
  readonly rolledBackAt: string | null;
};

export type TreasuryTransferKind =
  | "internal"
  | "intercompany"
  | "bank"
  | "wire"
  | "ach";

export type TreasuryTransferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "executed"
  | "rejected"
  | "failed";

export type TreasuryTransferRequest = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: TreasuryTransferKind;
  readonly status: TreasuryTransferStatus;
  readonly fromBankAccountId: string;
  readonly toBankAccountId: string;
  readonly fromEntityId: string | null;
  readonly toEntityId: string | null;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly memo: string | null;
  readonly requiresDualAuth: boolean;
  readonly approvedBy: readonly string[];
  readonly createdBy: string;
  readonly createdAt: string;
  readonly executedAt: string | null;
};

export type CashPosition = {
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly consolidated: {
    readonly current: number;
    readonly available: number;
    readonly restricted: number;
    readonly pending: number;
    readonly currency: CurrencyCode;
  };
  readonly byEntity: readonly {
    readonly entityId: string | null;
    readonly current: number;
    readonly available: number;
    readonly restricted: number;
  }[];
  readonly byAccount: readonly {
    readonly bankAccountId: string;
    readonly name: string;
    readonly kind: string;
    readonly entityId: string | null;
    readonly departmentId: string | null;
    readonly programId: string | null;
    readonly current: number;
    readonly available: number;
    readonly restricted: number;
    readonly pending: number;
    readonly currency: CurrencyCode;
    readonly masked: string;
  }[];
  /** Forecasting intentionally not implemented — hook only. */
  readonly forecastingHookReady: true;
};

export type CategorizationRule = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly matchContains: string;
  readonly category: string;
  readonly vendorId: string | null;
  readonly customerId: string | null;
  readonly active: boolean;
};

export type MatchTargetType =
  | "transaction"
  | "deposit"
  | "payment"
  | "invoice"
  | "bill"
  | "journal_entry";

/** Matching infrastructure only — no reconciliation engine. */
export type MatchCandidate = {
  readonly id: string;
  readonly organizationId: string;
  readonly leftType: MatchTargetType;
  readonly leftId: string;
  readonly rightType: MatchTargetType;
  readonly rightId: string;
  readonly score: number;
  readonly status: "suggested" | "accepted" | "rejected";
  readonly createdAt: string;
  readonly note: string | null;
};

export type BankingExceptionKind =
  | "unknown_transaction"
  | "duplicate"
  | "missing_reference"
  | "large_transaction"
  | "policy_violation";

export type BankingException = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: BankingExceptionKind;
  readonly severity: "low" | "medium" | "high";
  readonly message: string;
  readonly relatedRecordType: string;
  readonly relatedRecordId: string;
  readonly open: boolean;
  readonly createdAt: string;
};

export type BankingNotificationKind =
  | "large_withdrawal"
  | "returned_payment"
  | "failed_import"
  | "transfer_approval"
  | "connection_failure";

export type BankingNotification = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: BankingNotificationKind;
  readonly message: string;
  readonly createdAt: string;
  readonly read: boolean;
};

export type TreasuryApprovalPolicy = {
  readonly organizationId: string;
  readonly singleApprovalLimit: number;
  readonly dualAuthLimit: number;
  readonly largeTransactionThreshold: number;
  readonly currency: CurrencyCode;
};

export const TREASURY_GUARDS = Object.freeze({
  operationalBanking: true,
  includesReconciliation: false,
  includesForecasting: false,
  includesAiCfo: false,
  includesEbitda: false,
  matchingInfrastructureOnly: true,
});
