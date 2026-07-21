export type AgingBucket =
  | "current"
  | "days_30"
  | "days_60"
  | "days_90"
  | "days_120_plus";

export type InvoiceLifecycleStatus =
  | "draft"
  | "pending"
  | "sent"
  | "partial"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void"
  | "voided"
  | "written_off"
  | "archived"
  | "cancelled";

export type PaymentMethodType =
  | "cash"
  | "check"
  | "ach"
  | "credit_card"
  | "scholarship"
  | "grant"
  | "credit_balance"
  | "manual_adjustment"
  | "other";

export type DiscountType =
  | "sibling"
  | "staff"
  | "promotional"
  | "manual"
  | "percentage"
  | "flat";

export type BillingModel =
  | "monthly"
  | "quarterly"
  | "annual"
  | "per_course"
  | "one_time";

export type RefundStatus =
  | "requested"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export const PAYMENT_METHODS: PaymentMethodType[] = [
  "cash",
  "check",
  "ach",
  "credit_card",
  "scholarship",
  "grant",
  "credit_balance",
  "manual_adjustment",
  "other",
];

export const INVOICE_STATUSES: InvoiceLifecycleStatus[] = [
  "draft",
  "pending",
  "sent",
  "partial",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "voided",
  "written_off",
  "archived",
];

export interface AgingBuckets {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
  total: number;
}

export interface FinanceOperationsSummary {
  revenueSummary: number;
  outstandingBalance: number;
  paymentsReceived: number;
  overdueAccounts: number;
  scholarshipsApplied: number;
  activePaymentPlans: number;
  refundQueueCount: number;
  alertCount: number;
  aging: AgingBuckets;
  projectedRevenue: number;
  cashReceived: number;
  collectionsRate: number;
}

export interface FamilyFinancialAccountView {
  id: string;
  auditId: string | null;
  accountNumber: string | null;
  familyId: string;
  familyName: string | null;
  schoolId: string;
  primaryResponsibleParty: string | null;
  currentBalance: number;
  availableCredits: number;
  scholarshipsTotal: number;
  paymentPlanId: string | null;
  status: string;
  agingBucket: AgingBucket | null;
}

export interface DiscountRuleInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  amountType: "percent" | "flat";
  amount: number;
  stackingPriority?: number;
  allowsStacking?: boolean;
  schoolId?: string | null;
  organizationId?: string | null;
}

export interface ApplyDiscountInput {
  discountRuleId?: string | null;
  discountType: DiscountType;
  amount: number;
  amountType?: "percent" | "flat";
  billingAccountId: string;
  invoiceId?: string | null;
  studentId?: string | null;
  notes?: string;
  baseAmount?: number;
}

export interface PaymentPlanGenerateInput {
  paymentPlanId: string;
  billingAccountId: string;
  startDate: string;
  installmentCount: number;
  totalAmount: number;
  frequency?: "monthly" | "custom";
  customDueDates?: string[];
}

export interface RefundRequestInput {
  billingAccountId: string;
  amount: number;
  reason?: string;
  invoiceId?: string | null;
  paymentId?: string | null;
  familyId?: string | null;
  studentId?: string | null;
  schoolId?: string | null;
  organizationId?: string | null;
  refundMethod?: string;
}
