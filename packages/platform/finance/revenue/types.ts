/**
 * P-011 — Revenue™ operational types.
 * Education funding is configurable — never hardcoded to AcademyOS.
 */

import type { CurrencyCode } from "../types";

/** Configurable funding source kinds — education examples are presets, not exclusive. */
export type FundingSourceKind =
  | "standard"
  | "tuition"
  | "registration_fee"
  | "scholarship"
  | "financial_aid"
  | "grant"
  | "state_funding"
  | "esa"
  | "voucher"
  | "district_contract"
  | "medicaid"
  | "therapy"
  | "transportation"
  | "meal"
  | "custom";

export type RecognitionBasis = "cash" | "accrual";

export type ContractKind =
  | "fixed"
  | "milestone"
  | "subscription"
  | "usage"
  | "grant"
  | "district"
  | "other";

export type BillingMode =
  | "manual"
  | "recurring"
  | "milestone"
  | "usage"
  | "contract";

export type CollectionStatus =
  | "current"
  | "reminder"
  | "promise_to_pay"
  | "payment_plan"
  | "dunning"
  | "collections"
  | "written_off";

export type FundingSource = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: FundingSourceKind;
  readonly name: string;
  readonly active: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
};

export type RevenueContract = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly kind: ContractKind;
  readonly name: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly startAt: string;
  readonly endAt: string | null;
  readonly fundingSourceId: string | null;
  readonly recognitionBasis: RecognitionBasis;
  readonly status: "draft" | "active" | "completed" | "cancelled";
  readonly createdAt: string;
};

export type Subscription = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly contractId: string | null;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly interval: "monthly" | "quarterly" | "annual";
  readonly nextBillAt: string;
  readonly active: boolean;
  readonly fundingSourceId: string | null;
};

export type RevenueInvoiceMeta = {
  readonly invoiceId: string;
  readonly organizationId: string;
  readonly contractId: string | null;
  readonly subscriptionId: string | null;
  readonly fundingSourceId: string | null;
  readonly billingMode: BillingMode;
  readonly deferredAmount: number;
  readonly recognizedAmount: number;
};

export type RecognitionEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly invoiceId: string | null;
  readonly contractId: string | null;
  readonly basis: RecognitionBasis;
  readonly kind:
    | "deferred"
    | "recognized"
    | "contract"
    | "grant"
    | "subscription"
    | "cash";
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly recognizedAt: string;
  readonly memo: string;
};

export type CollectionActivity = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly invoiceId: string | null;
  readonly status: CollectionStatus;
  readonly note: string;
  readonly promiseToPayAt: string | null;
  readonly paymentPlanId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type PaymentPlan = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly invoiceIds: readonly string[];
  readonly installments: readonly { dueAt: string; amount: number }[];
  readonly active: boolean;
};

export type ReminderRule = {
  readonly id: string;
  readonly organizationId: string;
  readonly daysPastDue: number;
  readonly channel: "email" | "portal" | "letter";
  readonly active: boolean;
};

export type CustomerPortalView = {
  readonly customerId: string;
  readonly organizationId: string;
  readonly invoices: readonly {
    id: string;
    amount: number;
    status: string;
    dueAt: string | null;
  }[];
  readonly payments: readonly {
    id: string;
    amount: number;
    paidAt: string;
  }[];
  readonly outstandingBalance: number;
  readonly paymentLinkHint: string;
  readonly documents: readonly { id: string; fileName: string }[];
};

export const REVENUE_GUARDS = Object.freeze({
  operationalRevenue: true,
  configurableFundingSources: true,
  educationHardcoded: false,
  includesFinancialStatements: false,
  includesForecasting: false,
  includesAiCfo: false,
  includesEbitda: false,
});

/** Preset funding kinds commonly used by education tenants — still configurable. */
export const EDUCATION_FUNDING_PRESETS = Object.freeze([
  "tuition",
  "registration_fee",
  "scholarship",
  "financial_aid",
  "grant",
  "state_funding",
  "esa",
  "voucher",
  "district_contract",
  "medicaid",
  "therapy",
  "transportation",
  "meal",
] as const satisfies readonly FundingSourceKind[]);
