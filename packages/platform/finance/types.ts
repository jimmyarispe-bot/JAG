/**
 * JAG Finance™ Foundation — canonical financial model (P-008).
 *
 * AI CFO, reconciliation, forecasting, and EBITDA are intentionally out of scope.
 */

export const COA_TEMPLATES = [
  "corporate",
  "nonprofit",
  "education",
  "healthcare",
  "government",
  "manufacturing",
  "professional_services",
  "custom",
] as const;

export type CoaTemplateId = (typeof COA_TEMPLATES)[number];

export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
  "contra_asset",
  "contra_liability",
  "contra_equity",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type EntityKind =
  | "single"
  | "parent"
  | "subsidiary"
  | "holding"
  | "nonprofit_affiliate"
  | "campus"
  | "division"
  | "business_unit"
  | "cost_center"
  | "department"
  | "program"
  | "project";

export type FinanceRole =
  | "read"
  | "create"
  | "approve"
  | "post"
  | "reconcile"
  | "close_period"
  | "financial_administrator"
  | "controller"
  | "cfo"
  | "auditor";

export type JournalStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "posted"
  | "reversed";

export type JournalKind =
  | "standard"
  | "recurring"
  | "adjusting"
  | "reversing";

export type BankingAccountKind =
  | "bank"
  | "checking"
  | "savings"
  | "money_market"
  | "credit_card"
  | "loan"
  | "line_of_credit"
  | "investment"
  | "cash"
  | "petty_cash"
  | "escrow"
  | "trust"
  | "restricted_cash";

export type CustomerKind =
  | "organization"
  | "individual"
  | "student"
  | "family"
  | "client"
  | "member"
  | "patient"
  | "donor"
  | "grantor";

export type CurrencyCode = string;

export type Money = {
  readonly amount: number;
  readonly currency: CurrencyCode;
};

export type FinanceEntity = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly kind: EntityKind;
  readonly parentEntityId: string | null;
  readonly currency: CurrencyCode;
  readonly active: boolean;
  readonly intercompany: boolean;
  readonly createdAt: string;
};

export type IntercompanyLink = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly relationship: string;
};

export type LedgerAccount = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityId: string | null;
  readonly number: string;
  readonly name: string;
  readonly type: AccountType;
  readonly parentAccountId: string | null;
  readonly templateId: CoaTemplateId | null;
  readonly active: boolean;
  readonly currency: CurrencyCode | null;
};

export type JournalLine = {
  readonly id: string;
  readonly accountId: string;
  readonly debit: number;
  readonly credit: number;
  readonly entityId: string | null;
  readonly memo: string | null;
};

export type JournalEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityId: string | null;
  readonly kind: JournalKind;
  readonly status: JournalStatus;
  readonly periodKey: string;
  readonly description: string;
  readonly lines: readonly JournalLine[];
  readonly attachmentIds: readonly string[];
  readonly createdBy: string;
  readonly approvedBy: string | null;
  readonly postedBy: string | null;
  readonly createdAt: string;
  readonly postedAt: string | null;
  readonly reversesEntryId: string | null;
  readonly recurringRule: string | null;
};

export type AccountingPeriod = {
  readonly organizationId: string;
  readonly periodKey: string;
  readonly locked: boolean;
  readonly lockedAt: string | null;
  readonly lockedBy: string | null;
};

export type BankAccount = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityId: string | null;
  readonly name: string;
  readonly kind: BankingAccountKind;
  readonly currency: CurrencyCode;
  readonly mask: string | null;
  readonly plaidItemId: string | null;
  readonly openBankingReady: boolean;
  readonly ledgerAccountId: string | null;
  readonly active: boolean;
  /** P-009 treasury extensions (optional for P-008 compat). */
  readonly institutionId?: string | null;
  readonly connectionId?: string | null;
  readonly departmentId?: string | null;
  readonly programId?: string | null;
  readonly restricted?: boolean;
  readonly currentBalance?: number;
  readonly availableBalance?: number;
};

export type BankStatementImport = {
  readonly id: string;
  readonly organizationId: string;
  readonly bankAccountId: string;
  readonly format: "csv" | "ofx" | "qbo" | "excel" | "pdf";
  readonly fileName: string;
  readonly rowCount: number;
  /** PDF is metadata-only in P-008; OCR deferred. */
  readonly metadataOnly: boolean;
  readonly importedAt: string;
  readonly importedBy: string;
};

export type Vendor = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly paymentTerms: string | null;
  readonly is1099: boolean;
  readonly category: string | null;
  readonly contacts: readonly { name: string; email: string | null }[];
  readonly addresses: readonly string[];
  readonly attachmentIds: readonly string[];
  readonly active: boolean;
};

export type FinanceCustomer = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly kind: CustomerKind;
  readonly paymentTerms: string | null;
  readonly contacts: readonly { name: string; email: string | null }[];
  readonly addresses: readonly string[];
  readonly active: boolean;
};

export type Bill = {
  readonly id: string;
  readonly organizationId: string;
  readonly vendorId: string;
  readonly entityId: string | null;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly dueAt: string | null;
  readonly status: "draft" | "pending_approval" | "approved" | "paid" | "void";
  readonly recurring: boolean;
  readonly credit: boolean;
  readonly createdAt: string;
};

export type Invoice = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly entityId: string | null;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly dueAt: string | null;
  readonly status: "draft" | "sent" | "partial" | "paid" | "void";
  readonly recurring: boolean;
  readonly credit: boolean;
  readonly createdAt: string;
};

export type PaymentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly direction: "out" | "in";
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly vendorId: string | null;
  readonly customerId: string | null;
  readonly billId: string | null;
  readonly invoiceId: string | null;
  readonly paidAt: string;
};

export type Budget = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly horizon: "annual" | "quarterly" | "monthly";
  readonly scope:
    | "organization"
    | "department"
    | "program"
    | "project"
    | "entity";
  readonly scopeId: string | null;
  readonly periodKey: string;
  readonly lines: readonly {
    accountId: string;
    amount: number;
  }[];
  /** Scenario placeholders — forecasting later. */
  readonly scenarioKey: string | null;
  readonly createdAt: string;
};

export type TreasuryTransfer = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromBankAccountId: string;
  readonly toBankAccountId: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly transferredAt: string;
  readonly memo: string | null;
};

export type FinanceAttachment = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind:
    | "receipt"
    | "invoice"
    | "contract"
    | "statement"
    | "supporting";
  readonly fileName: string;
  readonly contentType: string;
  readonly linkedRecordType: string | null;
  readonly linkedRecordId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type FinanceAuditEvent = {
  readonly id: string;
  readonly organizationId: string;
  readonly action: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly userId: string;
  readonly timestamp: string;
  readonly previousValue: string | null;
  readonly newValue: string | null;
  readonly approval: string | null;
};

export type FinancePermissionGrant = {
  readonly organizationId: string;
  readonly userId: string;
  readonly roles: readonly FinanceRole[];
};

export type AgingBucket = {
  readonly label: "current" | "1_30" | "31_60" | "61_90" | "90_plus";
  readonly amount: number;
};

export type FinanceDashboard = {
  readonly generatedAt: string;
  readonly entityCount: number;
  readonly accountCount: number;
  readonly postedJournalCount: number;
  readonly openPayables: number;
  readonly openReceivables: number;
  readonly bankAccountCount: number;
  readonly budgetCount: number;
  readonly lockedPeriods: readonly string[];
  /** Explicit: foundation only — no AI / recon / forecast / EBITDA. */
  readonly foundationOnly: true;
};
