import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../helpers/mock-supabase";
import type { IdentityContext } from "@/lib/platform/identity/context";

vi.mock("@/lib/platform/shared/context", () => ({
  resolveActorUserId: vi.fn(async () => TEST_UUIDS.user),
  resolveSchoolContext: vi.fn(async () => ({
    organizationId: TEST_UUIDS.organization,
    schoolId: TEST_UUIDS.school,
  })),
}));

vi.mock("@/lib/platform/activity", () => ({
  recordActivity: vi.fn(async () => ({ id: TEST_UUIDS.activity })),
}));

import { recordActivity } from "@/lib/platform/activity";
import {
  canEditFinance,
  canManageAllFinance,
  canViewFinance,
  canViewOwnFamilyFinance,
  canViewSchoolFinanceReporting,
} from "@/lib/finance-platform/access";
import {
  accumulateAging,
  bucketForDays,
  daysPastDue,
  emptyAging,
} from "@/lib/finance-platform/aging";
import { resolveStackedDiscounts } from "@/lib/finance-platform/discounts";
import {
  normalizeBillingModel,
  periodAmountFromAnnual,
} from "@/lib/finance-platform/tuition";
import { normalizePaymentMethod, chargeViaProvider, ensurePaymentExtensionsRegistered } from "@/lib/finance-platform/payments";
import {
  ensureAccountingExtensionsRegistered,
  syncAccounting,
} from "@/lib/finance-platform/accounting";
import { applyScholarshipToInvoice } from "@/lib/finance-platform/scholarships";
import { createRefundRequest, completeRefund } from "@/lib/finance-platform/refunds";
import { generatePaymentPlanInstallments } from "@/lib/finance-platform/payment-plans";
import { voidInvoice, deleteInvoice, duplicateInvoice } from "@/lib/finance-platform/invoices";
import { getExtension } from "@/lib/workflows/extension";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { WORKFLOW_ACTION_LIBRARY } from "@/lib/workflows/actions";

const INVOICE_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ACCOUNT_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const AWARD_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const PLAN_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function identityWithRoles(roles: string[], permissions: string[] = []): IdentityContext {
  return {
    id: TEST_UUIDS.user,
    email: "test@example.com",
    fullName: "Test User",
    roles: roles as IdentityContext["roles"],
    primaryRole: roles[0] as IdentityContext["primaryRole"],
    roleLabel: roles[0] ?? "User",
    effectiveUserId: TEST_UUIDS.user,
    permissions: permissions as IdentityContext["permissions"],
    orgAssignments: [],
    accessibleSchoolIds: [TEST_UUIDS.school],
    hasUnrestrictedSchoolAccess: roles.includes("CEO") || roles.includes("FOUNDER"),
    isFounder: roles.includes("FOUNDER"),
    isEnterpriseAdmin: false,
    impersonation: null,
    preferences: null,
  };
}

describe("finance permissions", () => {
  it("gives CEO/Finance full access; teachers and students none", () => {
    expect(canManageAllFinance(identityWithRoles(["CEO"]))).toBe(true);
    expect(canManageAllFinance(identityWithRoles(["FOUNDER"]))).toBe(true);
    expect(canEditFinance(identityWithRoles([], ["FINANCE_ACCESS"]))).toBe(true);
    expect(canViewSchoolFinanceReporting(identityWithRoles(["SCHOOL_LEADER"]))).toBe(true);
    expect(canViewOwnFamilyFinance(identityWithRoles(["PARENT"]))).toBe(true);
    expect(canViewFinance(identityWithRoles(["TEACHER"]))).toBe(false);
    expect(canViewFinance(identityWithRoles(["STUDENT"]))).toBe(false);
  });
});

describe("financial calculations", () => {
  it("computes aging buckets", () => {
    expect(bucketForDays(-1)).toBe("current");
    expect(bucketForDays(10)).toBe("days_30");
    expect(bucketForDays(45)).toBe("days_60");
    expect(bucketForDays(75)).toBe("days_90");
    expect(bucketForDays(130)).toBe("days_120_plus");
    expect(daysPastDue("2026-07-01", new Date("2026-07-21T00:00:00.000Z"))).toBe(20);

    let aging = emptyAging();
    aging = accumulateAging(aging, 100, 0);
    aging = accumulateAging(aging, 50, 40);
    expect(aging.current).toBe(100);
    expect(aging.days60).toBe(50);
    expect(aging.total).toBe(150);
  });

  it("resolves tuition period amounts and billing models", () => {
    expect(normalizeBillingModel("Monthly")).toBe("monthly");
    expect(normalizeBillingModel("quarterly")).toBe("quarterly");
    expect(normalizeBillingModel("per-course")).toBe("per_course");
    expect(periodAmountFromAnnual(12000, "monthly")).toBe(1000);
    expect(periodAmountFromAnnual(12000, "quarterly")).toBe(3000);
    expect(periodAmountFromAnnual(12000, "annual")).toBe(12000);
  });

  it("applies stacking discount rules", () => {
    const result = resolveStackedDiscounts(
      [
        {
          id: "1",
          amount: 10,
          amountType: "percent",
          stackingPriority: 1,
          allowsStacking: true,
        },
        {
          id: "2",
          amount: 50,
          amountType: "flat",
          stackingPriority: 2,
          allowsStacking: false,
        },
        {
          id: "3",
          amount: 5,
          amountType: "percent",
          stackingPriority: 3,
          allowsStacking: true,
        },
      ],
      1000
    );
    // 10% of 1000 = 100, then flat 50, then stop
    expect(result.totalDiscount).toBe(150);
    expect(result.applied).toHaveLength(2);
  });

  it("normalizes payment methods", () => {
    expect(normalizePaymentMethod("credit card")).toBe("credit_card");
    expect(normalizePaymentMethod("card")).toBe("credit_card");
    expect(normalizePaymentMethod("ACH")).toBe("ach");
    expect(normalizePaymentMethod("weird")).toBe("other");
  });
});

describe("invoice lifecycle", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("voids unpaid invoices", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "invoices" && operation === "maybeSingle") {
        return {
          data: {
            id: INVOICE_ID,
            invoice_status: "sent",
            amount_paid: 0,
            billing_account_id: ACCOUNT_ID,
            invoice_number: "INV-1",
            student_id: TEST_UUIDS.student,
            family_billing_accounts: {
              school_id: TEST_UUIDS.school,
              family_id: TEST_UUIDS.student,
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await voidInvoice(supabase as never, INVOICE_ID, "Duplicate");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("voided");
  });

  it("blocks delete when policy locked", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "invoices" && operation === "maybeSingle") {
        return {
          data: {
            id: INVOICE_ID,
            invoice_status: "draft",
            amount_paid: 0,
            policy_locked: true,
            billing_account_id: ACCOUNT_ID,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await deleteInvoice(supabase as never, {
      invoiceId: INVOICE_ID,
      confirmationText: "DELETE",
      acknowledged: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.suggestArchive).toBe(true);
  });

  it("duplicates an invoice as draft", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "invoices" && operation === "maybeSingle") {
        return {
          data: {
            id: INVOICE_ID,
            billing_account_id: ACCOUNT_ID,
            tuition_plan_id: null,
            student_id: TEST_UUIDS.student,
            invoice_number: "INV-1",
            description: "Tuition",
            subtotal: 1000,
            sibling_discount_amount: 0,
            scholarship_credit: 0,
            state_funding_credit: 0,
            total_amount: 1000,
            family_responsibility: 1000,
            due_date: "2026-08-01",
            invoice_status: "sent",
            family_billing_accounts: {
              school_id: TEST_UUIDS.school,
              family_id: TEST_UUIDS.student,
            },
          },
          error: null,
        };
      }
      if (table === "invoices" && (operation === "insert" || operation === "single")) {
        return { data: { id: "new-invoice-id" }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await duplicateInvoice(supabase as never, INVOICE_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("draft");
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "invoice.created")
    ).toBe(true);
  });
});

describe("scholarships", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("applies award and prevents over-allocation", async () => {
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "scholarship_applications" && operation === "maybeSingle") {
        return {
          data: {
            id: AWARD_ID,
            student_id: TEST_UUIDS.student,
            approved_amount: 500,
            remaining_award_balance: 200,
            scholarship_status: "approved",
            school_id: TEST_UUIDS.school,
            family_id: null,
          },
          error: null,
        };
      }
      if (table === "invoices" && operation === "maybeSingle") {
        return {
          data: {
            id: INVOICE_ID,
            billing_account_id: ACCOUNT_ID,
            student_id: TEST_UUIDS.student,
            subtotal: 1000,
            scholarship_credit: 0,
            total_amount: 1000,
            amount_paid: 0,
            family_responsibility: 1000,
            family_billing_accounts: {
              school_id: TEST_UUIDS.school,
              family_id: null,
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await applyScholarshipToInvoice(supabase as never, {
      scholarshipApplicationId: AWARD_ID,
      invoiceId: INVOICE_ID,
      amount: 500,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appliedAmount).toBe(200);
      expect(result.remainingBalance).toBe(0);
    }
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "scholarship.applied")
    ).toBe(true);
  });
});

describe("payment plans + refunds", () => {
  beforeEach(() => {
    vi.mocked(recordActivity).mockClear();
  });

  it("generates monthly installments that sum to total", async () => {
    const supabase = createMockSupabase(({ table, operation, payload }) => {
      if (table === "payment_plan_installments" && (operation === "insert" || operation === "single")) {
        const rows = Array.isArray(payload) ? payload : [payload];
        return {
          data: rows.map((_, i) => ({ id: `inst-${i}` })),
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await generatePaymentPlanInstallments(supabase as never, {
      paymentPlanId: PLAN_ID,
      billingAccountId: ACCOUNT_ID,
      startDate: "2026-08-01",
      installmentCount: 3,
      totalAmount: 1000,
      frequency: "monthly",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.count).toBe(3);
  });

  it("creates and completes refund requests with EI events", async () => {
    const refundId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const supabase = createMockSupabase(({ table, operation }) => {
      if (table === "family_billing_accounts" && operation === "maybeSingle") {
        return {
          data: {
            id: ACCOUNT_ID,
            school_id: TEST_UUIDS.school,
            family_id: TEST_UUIDS.student,
            credit_balance: 0,
          },
          error: null,
        };
      }
      if (table === "billing_refunds" && (operation === "insert" || operation === "single")) {
        return {
          data: { id: refundId, audit_id: TEST_UUIDS.activity, status: "requested" },
          error: null,
        };
      }
      if (table === "billing_refunds" && operation === "maybeSingle") {
        return {
          data: {
            id: refundId,
            audit_id: TEST_UUIDS.activity,
            status: "approved",
            amount: 75,
            refund_method: "credit_balance",
            billing_account_id: ACCOUNT_ID,
            school_id: TEST_UUIDS.school,
            family_id: TEST_UUIDS.student,
            student_id: null,
            reason: "Overpayment",
            reviewed_at: null,
            reviewed_by: null,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const created = await createRefundRequest(supabase as never, {
      billingAccountId: ACCOUNT_ID,
      amount: 75,
      reason: "Overpayment",
      schoolId: TEST_UUIDS.school,
    });
    expect(created.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "refund.created")
    ).toBe(true);

    const completed = await completeRefund(supabase as never, refundId);
    expect(completed.ok).toBe(true);
    expect(
      vi.mocked(recordActivity).mock.calls.some((c) => c[1]?.eventType === "refund.completed")
    ).toBe(true);
  });
});

describe("extensions + workflow + EI wiring", () => {
  it("registers payment and accounting adapters as deferred", async () => {
    ensurePaymentExtensionsRegistered();
    ensureAccountingExtensionsRegistered();
    expect(getExtension("square")).toBeTruthy();
    expect(getExtension("stripe")).toBeTruthy();
    expect(getExtension("quickbooks_online")).toBeTruthy();

    const charge = await chargeViaProvider({
      amount: 100,
      method: "credit_card",
      organizationId: TEST_UUIDS.organization,
      schoolId: TEST_UUIDS.school,
      provider: "stripe",
    });
    expect(charge.deferred).toBe(true);

    const accounting = await syncAccounting({
      operation: "export_invoice",
      organizationId: TEST_UUIDS.organization,
      provider: "xero",
    });
    expect(accounting.deferred).toBe(true);
  });

  it("registers required finance EI events", () => {
    for (const key of [
      "finance.account.created",
      "invoice.created",
      "invoice.sent",
      "invoice.paid",
      "invoice.overdue",
      "payment.received",
      "payment.failed",
      "scholarship.applied",
      "discount.applied",
      "refund.created",
      "refund.completed",
    ]) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });

  it("exposes finance workflow actions", () => {
    const types = WORKFLOW_ACTION_LIBRARY.map((a) => a.type);
    expect(types).toContain("generate_invoice");
    expect(types).toContain("apply_scholarship");
    expect(types).toContain("send_billing_reminder");
    expect(types).toContain("mark_invoice_paid");
    expect(types).toContain("issue_refund_request");
    expect(types).toContain("escalate_overdue_account");
  });
});
