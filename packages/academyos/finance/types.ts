/** Financial Operations™ — tuition, billing, scholarships, family accounts. */

export const TUITION_FREQUENCIES = [
  "Annual",
  "Monthly",
  "Quarterly",
  "Weekly",
  "Custom",
] as const;
export type TuitionFrequency = (typeof TUITION_FREQUENCIES)[number];

export const INVOICE_STATUSES = [
  "Draft",
  "Issued",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
  "Written Off",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_CATEGORIES = [
  "Tuition",
  "Registration",
  "Assessments",
  "Therapy",
  "Materials",
  "Field Trips",
  "Miscellaneous",
  "Late Fee",
] as const;
export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  "Manual",
  "Online",
  "AutoPay",
  "Credit",
  "Refund",
  "Other",
] as const;
export type PaymentMethodKind = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "Pending",
  "Completed",
  "Failed",
  "Refunded",
  "Voided",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type FinanceBillingConfig = {
  readonly monthlyDueDay: number;
  readonly reminderUntilMonthEnd: boolean;
  readonly lateFeeStartDayOfNextMonth: number;
  readonly lateFeeDailyAmount: number;
  readonly lateFeeMaxDays: number;
  readonly siblingDiscountPercent: number;
  /** Only one student per family receives sibling discount. */
  readonly siblingDiscountOneStudentOnly: boolean;
  readonly scholarshipAppliesBeforeFamilyResponsibility: boolean;
};

export type TuitionPlan = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly frequency: TuitionFrequency;
  readonly baseAmount: number;
  readonly program: string | null;
  readonly campusId: string | null;
  readonly gradeLevel: string | null;
  readonly siblingDiscountPercent: number | null;
  readonly promotionalDiscountPercent: number;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly status: "Draft" | "Active" | "Archived";
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type TuitionSchedule = {
  readonly id: string;
  readonly organizationId: string;
  readonly tuitionPlanId: string;
  readonly familyAccountId: string;
  readonly studentId: string;
  readonly amount: number;
  readonly dueDay: number;
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type PaymentMethodRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly familyAccountId: string;
  readonly kind: PaymentMethodKind;
  readonly label: string;
  readonly lastFour: string | null;
  readonly isDefault: boolean;
  readonly createdAt: string;
};

export type ResponsibleParty = {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly sharePercent: number;
};

export type FamilyFinancialAccount = {
  readonly id: string;
  readonly organizationId: string;
  readonly accountNumber: string;
  readonly displayName: string;
  readonly responsibleParties: readonly ResponsibleParty[];
  readonly studentIds: readonly string[];
  readonly tuitionPlanIds: readonly string[];
  readonly scholarshipAwardIds: readonly string[];
  readonly paymentMethodIds: readonly string[];
  readonly autoPayEnabled: boolean;
  readonly siblingDiscountStudentId: string | null;
  readonly creditBalance: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type ScholarshipAward = {
  readonly id: string;
  readonly organizationId: string;
  readonly familyAccountId: string | null;
  readonly studentId: string | null;
  readonly applicantId: string | null;
  readonly domainScholarshipId: string | null;
  readonly fundingSource: string;
  readonly awardAmount: number;
  readonly remainingBalance: number;
  readonly documentationComplete: boolean;
  readonly renewalDate: string | null;
  readonly expiresOn: string | null;
  readonly status: "Pending" | "Active" | "Exhausted" | "Expired" | "Revoked";
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type InvoiceLine = {
  readonly id: string;
  readonly category: InvoiceCategory;
  readonly description: string;
  readonly amount: number;
};

export type FinanceInvoice = {
  readonly id: string;
  readonly organizationId: string;
  readonly familyAccountId: string;
  readonly studentId: string | null;
  readonly invoiceNumber: string;
  readonly category: InvoiceCategory;
  readonly lines: readonly InvoiceLine[];
  readonly subtotal: number;
  readonly siblingDiscountAmount: number;
  readonly promotionalDiscountAmount: number;
  readonly scholarshipApplied: number;
  readonly lateFeeAmount: number;
  readonly totalAmount: number;
  readonly amountPaid: number;
  readonly balanceDue: number;
  readonly status: InvoiceStatus;
  readonly issuedOn: string | null;
  readonly dueOn: string;
  readonly periodMonth: string | null;
  readonly twinEntityId: string | null;
  readonly quickbooksSyncId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type FinancePayment = {
  readonly id: string;
  readonly organizationId: string;
  readonly familyAccountId: string;
  readonly invoiceId: string | null;
  readonly amount: number;
  readonly method: PaymentMethodKind;
  readonly status: PaymentStatus;
  readonly reference: string | null;
  readonly processor: string | null;
  readonly paidOn: string;
  readonly isRefund: boolean;
  readonly twinEntityId: string | null;
  readonly quickbooksSyncId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type FinanceCredit = {
  readonly id: string;
  readonly organizationId: string;
  readonly familyAccountId: string;
  readonly amount: number;
  readonly reason: string;
  readonly remaining: number;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type QuickBooksSyncRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly entityType: "Customer" | "Invoice" | "Payment" | "Credit";
  readonly entityId: string;
  readonly status: "Queued" | "Synced" | "Failed";
  readonly connectorJobId: string | null;
  readonly message: string;
  readonly syncedAt: string | null;
  readonly createdAt: string;
};

export type AgingBucket = {
  readonly current: number;
  readonly days1to30: number;
  readonly days31to60: number;
  readonly days61to90: number;
  readonly days90Plus: number;
};

export type FinancialOperationsSummary = {
  readonly organizationId: string;
  readonly accountsReceivable: number;
  readonly currentMonthRevenue: number;
  readonly outstandingTuition: number;
  readonly scholarshipFunding: number;
  readonly collections: number;
  readonly aging: AgingBucket;
  readonly paymentRate: number;
  readonly enrollmentRevenue: number;
  readonly revenueByCampus: Readonly<Record<string, number>>;
  readonly revenueByProgram: Readonly<Record<string, number>>;
};
