/**
 * Enterprise Financial Intelligence Engine — shared types.
 *
 * Sprint 019 | ENTERPRISE_FINANCE_VERSION = "0.1.0"
 *
 * Immutable accounting rule: transactions are NEVER deleted — only reversed.
 * Every financial transaction carries a FinanceDimensionalContext.
 */

import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

export const ENTERPRISE_FINANCE_VERSION = "0.1.0";

/** Opaque metadata bag (alias of IntelligenceMetadata). */
export type FinanceMetadata = IntelligenceMetadata;

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export interface FinanceMoney {
  amount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Dimensional context — required on every financial transaction
// ---------------------------------------------------------------------------

export interface FinanceDimensionalContext {
  organizationId: string | null;
  schoolId: string | null;
  campusId: string | null;
  departmentId: string | null;
  programId: string | null;
  employeeId: string | null;
  studentId: string | null;
  vendorId: string | null;
  customerId: string | null;
  fundingSourceId: string | null;
  grantId: string | null;
  scholarshipId: string | null;
  projectId: string | null;
  workflowRef: string | null;
  evidenceRef: string | null;
  approvalRef: string | null;
  auditRef: string | null;
}

export function emptyDimensions(
  overrides?: Partial<FinanceDimensionalContext>
): FinanceDimensionalContext {
  return {
    organizationId: null,
    schoolId: null,
    campusId: null,
    departmentId: null,
    programId: null,
    employeeId: null,
    studentId: null,
    vendorId: null,
    customerId: null,
    fundingSourceId: null,
    grantId: null,
    scholarshipId: null,
    projectId: null,
    workflowRef: null,
    evidenceRef: null,
    approvalRef: null,
    auditRef: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Base immutable transaction
// ---------------------------------------------------------------------------

export interface FinanceTransactionBase {
  id: string;
  timestamp: string;
  dimensions: FinanceDimensionalContext;
  amount: FinanceMoney;
  memo: string;
  reversedById: string | null;
  reversesId: string | null;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Chart of accounts / General ledger
// ---------------------------------------------------------------------------

export const FINANCE_ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;
export type FinanceAccountType = (typeof FINANCE_ACCOUNT_TYPES)[number];

export const FINANCE_ACCOUNT_STATUSES = ["active", "inactive"] as const;
export type FinanceAccountStatus = (typeof FINANCE_ACCOUNT_STATUSES)[number];

export interface FinanceAccount {
  id: string;
  code: string;
  name: string;
  type: FinanceAccountType;
  status: FinanceAccountStatus;
  parentId: string | null;
  description: string;
  isControl: boolean;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export const FINANCE_JOURNAL_STATUSES = ["draft", "posted", "reversed"] as const;
export type FinanceJournalStatus = (typeof FINANCE_JOURNAL_STATUSES)[number];

export interface FinanceJournalPosting {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  dimensions: FinanceDimensionalContext;
  memo: string;
}

export interface FinanceJournalEntry extends FinanceTransactionBase {
  journalNumber: string;
  status: FinanceJournalStatus;
  postings: FinanceJournalPosting[];
  currency: string;
}

export interface FinanceTrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: FinanceAccountType;
  debitBalance: number;
  creditBalance: number;
}

export interface FinanceTrialBalance {
  asOfDate: string;
  currency: string;
  lines: FinanceTrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface FinanceAccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: FinanceAccountType;
  debitBalance: number;
  creditBalance: number;
  normalBalance: number;
}

// ---------------------------------------------------------------------------
// Accounts Receivable
// ---------------------------------------------------------------------------

export const FINANCE_INVOICE_STATUSES = [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "void",
  "written_off",
] as const;
export type FinanceInvoiceStatus = (typeof FINANCE_INVOICE_STATUSES)[number];

export interface FinanceInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  amount: number;
  accountId: string | null;
  dimensions: FinanceDimensionalContext;
  metadata?: FinanceMetadata;
}

export interface FinanceInvoice extends FinanceTransactionBase {
  invoiceNumber: string;
  status: FinanceInvoiceStatus;
  customerId: string;
  dueDate: string;
  items: FinanceInvoiceItem[];
  paidAmount: number;
  currency: string;
  isRecurring: boolean;
  recurringIntervalDays: number | null;
}

export interface FinanceAgingBucket {
  current: FinanceMoney;
  days30: FinanceMoney;
  days60: FinanceMoney;
  days90: FinanceMoney;
  days120Plus: FinanceMoney;
  total: FinanceMoney;
}

// ---------------------------------------------------------------------------
// Accounts Payable
// ---------------------------------------------------------------------------

export interface FinanceVendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
  paymentTermsDays: number;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export const FINANCE_PURCHASE_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type FinancePurchaseRequestStatus =
  (typeof FINANCE_PURCHASE_REQUEST_STATUSES)[number];

export interface FinancePurchaseRequest extends FinanceTransactionBase {
  requestNumber: string;
  vendorId: string | null;
  status: FinancePurchaseRequestStatus;
  requestedBy: string;
  description: string;
  lineItems: FinanceInvoiceItem[];
  currency: string;
}

export const FINANCE_PO_STATUSES = [
  "open",
  "partially_received",
  "received",
  "cancelled",
  "closed",
] as const;
export type FinancePOStatus = (typeof FINANCE_PO_STATUSES)[number];

export interface FinancePurchaseOrder extends FinanceTransactionBase {
  poNumber: string;
  vendorId: string;
  status: FinancePOStatus;
  requestId: string | null;
  items: FinanceInvoiceItem[];
  currency: string;
  approvedBy: string | null;
  receivedAmount: number;
}

export const FINANCE_BILL_STATUSES = [
  "received",
  "approved",
  "partial",
  "paid",
  "overdue",
  "void",
] as const;
export type FinanceBillStatus = (typeof FINANCE_BILL_STATUSES)[number];

export interface FinanceBill extends FinanceTransactionBase {
  billNumber: string;
  vendorId: string;
  poId: string | null;
  status: FinanceBillStatus;
  dueDate: string;
  items: FinanceInvoiceItem[];
  paidAmount: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Banking
// ---------------------------------------------------------------------------

export const FINANCE_BANK_ACCOUNT_TYPES = [
  "checking",
  "savings",
  "money_market",
  "investment",
] as const;
export type FinanceBankAccountType = (typeof FINANCE_BANK_ACCOUNT_TYPES)[number];

export interface FinanceBankAccount {
  id: string;
  name: string;
  type: FinanceBankAccountType;
  bankName: string;
  accountNumber: string;
  routingNumber: string | null;
  currency: string;
  isActive: boolean;
  currentBalance: number;
  lastReconciledDate: string | null;
  glAccountId: string | null;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export const FINANCE_BANK_TRANSACTION_TYPES = [
  "deposit",
  "withdrawal",
  "transfer",
  "fee",
  "interest",
] as const;
export type FinanceBankTransactionType =
  (typeof FINANCE_BANK_TRANSACTION_TYPES)[number];

export interface FinanceBankTransaction extends FinanceTransactionBase {
  bankAccountId: string;
  transactionType: FinanceBankTransactionType;
  externalRef: string | null;
  isReconciled: boolean;
  reconciledAt: string | null;
  currency: string;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const FINANCE_PAYMENT_METHODS = [
  "ach",
  "check",
  "wire",
  "card",
  "cash",
  "square",
] as const;
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];

export const FINANCE_PAYMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "voided",
] as const;
export type FinancePaymentStatus = (typeof FINANCE_PAYMENT_STATUSES)[number];

export const FINANCE_PAYMENT_DIRECTIONS = ["inbound", "outbound"] as const;
export type FinancePaymentDirection = (typeof FINANCE_PAYMENT_DIRECTIONS)[number];

export interface FinancePaymentAllocation {
  invoiceId: string | null;
  billId: string | null;
  allocatedAmount: number;
  currency: string;
}

export interface FinancePayment extends FinanceTransactionBase {
  paymentNumber: string;
  method: FinancePaymentMethod;
  direction: FinancePaymentDirection;
  status: FinancePaymentStatus;
  bankAccountId: string | null;
  referenceNumber: string | null;
  allocations: FinancePaymentAllocation[];
  currency: string;
  refundedAmount: number;
}

// ---------------------------------------------------------------------------
// Cash management
// ---------------------------------------------------------------------------

export const FINANCE_CASH_FLOW_CATEGORIES = [
  "operating",
  "investing",
  "financing",
] as const;
export type FinanceCashFlowCategory =
  (typeof FINANCE_CASH_FLOW_CATEGORIES)[number];

export interface FinanceCashFlowItem {
  id: string;
  category: FinanceCashFlowCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  dimensions: FinanceDimensionalContext;
}

export interface FinanceCashForecast {
  id: string;
  generatedAt: string;
  horizonDays: number;
  startingBalance: number;
  projectedInflows: number;
  projectedOutflows: number;
  projectedEndBalance: number;
  currency: string;
  runwayDays: number;
  dailyBurnRate: number;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Budgeting
// ---------------------------------------------------------------------------

export const FINANCE_BUDGET_STATUSES = [
  "draft",
  "approved",
  "active",
  "closed",
] as const;
export type FinanceBudgetStatus = (typeof FINANCE_BUDGET_STATUSES)[number];

export interface FinanceBudgetLine {
  id: string;
  budgetId: string;
  accountId: string;
  description: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  currency: string;
  dimensions: FinanceDimensionalContext;
}

export interface FinanceBudget {
  id: string;
  name: string;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  status: FinanceBudgetStatus;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  currency: string;
  lines: FinanceBudgetLine[];
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Fixed assets
// ---------------------------------------------------------------------------

export const FINANCE_ASSET_STATUSES = [
  "active",
  "disposed",
  "fully_depreciated",
] as const;
export type FinanceAssetStatus = (typeof FINANCE_ASSET_STATUSES)[number];

export const FINANCE_DEPRECIATION_METHODS = [
  "straight_line",
  "double_declining",
] as const;
export type FinanceDepreciationMethod =
  (typeof FINANCE_DEPRECIATION_METHODS)[number];

export interface FinanceFixedAsset {
  id: string;
  name: string;
  description: string;
  acquisitionDate: string;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: FinanceDepreciationMethod;
  accumulatedDepreciation: number;
  bookValue: number;
  status: FinanceAssetStatus;
  disposedAt: string | null;
  disposalProceeds: number | null;
  glAccountId: string | null;
  currency: string;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export interface FinanceDepreciationEntry {
  assetId: string;
  periodStart: string;
  periodEnd: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  bookValue: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Debt / Loans
// ---------------------------------------------------------------------------

export const FINANCE_LOAN_STATUSES = [
  "active",
  "paid_off",
  "defaulted",
  "restructured",
] as const;
export type FinanceLoanStatus = (typeof FINANCE_LOAN_STATUSES)[number];

export interface FinanceLoanScheduleEntry {
  paymentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalPayment: number;
  remainingBalance: number;
  isPaid: boolean;
  paidDate: string | null;
}

export interface FinanceLoanCovenant {
  id: string;
  loanId: string;
  name: string;
  description: string;
  threshold: number;
  currentValue: number | null;
  isBreached: boolean;
  checkedAt: string | null;
}

export interface FinanceLoan {
  id: string;
  lenderName: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  status: FinanceLoanStatus;
  schedule: FinanceLoanScheduleEntry[];
  covenants: FinanceLoanCovenant[];
  currency: string;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Grants
// ---------------------------------------------------------------------------

export const FINANCE_GRANT_STATUSES = [
  "active",
  "completed",
  "expired",
  "suspended",
] as const;
export type FinanceGrantStatus = (typeof FINANCE_GRANT_STATUSES)[number];

export const FINANCE_GRANT_RESTRICTION_TYPES = [
  "restricted",
  "unrestricted",
  "temporarily_restricted",
] as const;
export type FinanceGrantRestrictionType =
  (typeof FINANCE_GRANT_RESTRICTION_TYPES)[number];

export interface FinanceGrant {
  id: string;
  name: string;
  grantorName: string;
  restriction: FinanceGrantRestrictionType;
  totalAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  periodStart: string;
  periodEnd: string;
  status: FinanceGrantStatus;
  reimbursementBasis: boolean;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export type FinanceGrantDrawdownStatus =
  | "submitted"
  | "approved"
  | "paid"
  | "rejected";

export interface FinanceGrantDrawdown extends FinanceTransactionBase {
  grantId: string;
  drawdownNumber: string;
  requestedAmount: number;
  approvedAmount: number | null;
  currency: string;
  status: FinanceGrantDrawdownStatus;
}

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

export const FINANCE_SCHOLARSHIP_STATUSES = [
  "active",
  "suspended",
  "exhausted",
  "expired",
] as const;
export type FinanceScholarshipStatus =
  (typeof FINANCE_SCHOLARSHIP_STATUSES)[number];

export interface FinanceScholarship {
  id: string;
  name: string;
  fundingSourceId: string;
  totalFunding: number;
  awardedAmount: number;
  remainingBalance: number;
  status: FinanceScholarshipStatus;
  dimensions: FinanceDimensionalContext;
  createdAt: string;
  metadata?: FinanceMetadata;
}

export interface FinanceScholarshipAward extends FinanceTransactionBase {
  scholarshipId: string;
  studentId: string;
  awardAmount: number;
  academicPeriod: string;
  currency: string;
  invoiceId: string | null;
}

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------

export const FINANCE_TAX_RECORD_TYPES = [
  "sales_tax",
  "payroll_tax",
  "form_1099",
  "form_w2",
] as const;
export type FinanceTaxRecordType = (typeof FINANCE_TAX_RECORD_TYPES)[number];

export interface FinanceTaxRecord {
  id: string;
  type: FinanceTaxRecordType;
  taxYear: number;
  recipientId: string;
  recipientName: string;
  recipientTaxId: string | null;
  amounts: Record<string, number>;
  currency: string;
  dimensions: FinanceDimensionalContext;
  generatedAt: string;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const FINANCE_AUDIT_EVENT_KINDS = [
  "approval",
  "invoice",
  "bill",
  "payment",
  "recommendation",
  "adjustment",
  "reversal",
  "journal",
  "export",
  "vendor",
  "grant",
  "scholarship",
  "asset",
  "loan",
  "budget",
  "tax",
  "banking",
  "cash",
] as const;
export type FinanceAuditEventKind = (typeof FINANCE_AUDIT_EVENT_KINDS)[number];

export interface FinanceAuditEvent {
  id: string;
  kind: FinanceAuditEventKind;
  entityId: string;
  entityType: string;
  action: string;
  actorId: string | null;
  timestamp: string;
  dimensions: FinanceDimensionalContext;
  details: Record<string, unknown>;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// QuickBooks export shapes
// ---------------------------------------------------------------------------

export interface QBCustomer {
  id: string;
  displayName: string;
  email: string | null;
  currency: string;
}

export interface QBVendor {
  id: string;
  displayName: string;
  email: string | null;
  taxId: string | null;
  currency: string;
}

export interface QBInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface QBInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate: string;
  lines: QBInvoiceLine[];
  totalAmount: number;
  balance: number;
  currency: string;
}

export interface QBBill {
  id: string;
  billNumber: string;
  vendorId: string;
  date: string;
  dueDate: string;
  lines: QBInvoiceLine[];
  totalAmount: number;
  balance: number;
  currency: string;
}

export interface QBPayment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: number;
  currency: string;
  customerId: string | null;
  vendorId: string | null;
  method: string;
}

export interface QBJournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface QBJournalEntry {
  id: string;
  date: string;
  journalNumber: string;
  lines: QBJournalLine[];
  currency: string;
}

export interface QBAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
}

export interface QBExportPackage {
  exportedAt: string;
  accounts: QBAccount[];
  customers: QBCustomer[];
  vendors: QBVendor[];
  invoices: QBInvoice[];
  bills: QBBill[];
  payments: QBPayment[];
  journalEntries: QBJournalEntry[];
}

// ---------------------------------------------------------------------------
// Executive intelligence snapshot + KPIs
// ---------------------------------------------------------------------------

export interface FinancialSnapshot {
  asOfDate: string;
  currency: string;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  netIncome: number;
  totalAssets: number;
  currentAssets: number;
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalLiabilities: number;
  currentLiabilities: number;
  accountsPayable: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalEquity: number;
  payrollExpense: number;
  interestExpense: number;
  depreciationAmortization: number;
  tuitionRevenue: number;
  grantRevenue: number;
  instructionExpense: number;
  administrativeExpense: number;
  facilityExpense: number;
  fundraisingExpense: number;
  priorPeriodRevenue: number;
  priorPeriodExpenses: number;
  budgetedRevenue: number;
  budgetedExpenses: number;
  arAging: FinanceAgingBucket;
  apAging: FinanceAgingBucket;
  monthlyBurnRate: number;
  overdueReceivables: number;
  totalReceivables: number;
  activeVendorCount: number;
  criticalVendorCount: number;
}

export type FinanceRiskLevel = "low" | "medium" | "high" | "critical";

export interface FinanceExecutiveKPIs {
  asOfDate: string;
  currency: string;
  ebitda: number;
  operatingMargin: number;
  cashRunwayDays: number;
  daysCashOnHand: number;
  currentRatio: number;
  quickRatio: number;
  revenueGrowth: number;
  expenseGrowth: number;
  enrollmentRevenue: number;
  grantDependency: number;
  payrollPercent: number;
  instructionPercent: number;
  administrativePercent: number;
  facilityPercent: number;
  fundraisingPercent: number;
  budgetVariance: number;
  forecastAccuracy: number;
  liquidityRisk: FinanceRiskLevel;
  collectionsRisk: FinanceRiskLevel;
  vendorRisk: FinanceRiskLevel;
  grantRisk: FinanceRiskLevel;
}

// ---------------------------------------------------------------------------
// CPA workpapers
// ---------------------------------------------------------------------------

export interface FinanceCPAWorkpaper {
  title: string;
  generatedAt: string;
  fiscalYear: number;
  sections: Record<string, unknown>;
  metadata?: FinanceMetadata;
}

// ---------------------------------------------------------------------------
// Engine cycle
// ---------------------------------------------------------------------------

export interface FinanceEngineCycleResult {
  cycleId: string;
  ranAt: string;
  modulesProcessed: string[];
  auditEvents: number;
}
