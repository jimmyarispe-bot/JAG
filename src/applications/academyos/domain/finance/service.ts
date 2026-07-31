import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  InvoiceRecord,
  PaymentRecord,
  ScholarshipRecord,
} from "@/applications/academyos/domain/repositories";

export const FinanceDomainService = {
  createInvoice(input: {
    displayName: string;
    amount: number;
    studentId?: string | null;
    familyId?: string | null;
    dueDate?: string | null;
    now?: string;
  }): DomainResult<InvoiceRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "Invoice number is required", "displayName"));
    }
    if (!(input.amount > 0)) {
      issues.push(issue("invalid_amount", "Amount must be greater than zero", "amount"));
    }
    if (!input.studentId && !input.familyId) {
      issues.push(
        issue("party_required", "Invoice requires a student or family", "studentId")
      );
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("inv"),
      displayName: input.displayName.trim(),
      studentId: input.studentId ?? null,
      familyId: input.familyId ?? null,
      amount: Number(input.amount.toFixed(2)),
      dueDate: input.dueDate ?? null,
      status: "invoice",
      createdAt: now,
      updatedAt: now,
    });
  },

  applyPayment(
    invoice: InvoiceRecord,
    input: {
      displayName: string;
      amount: number;
      paidOn: string;
      method?: string | null;
      now?: string;
    }
  ): DomainResult<{ invoice: InvoiceRecord; payment: PaymentRecord }> {
    if (["closed", "cancelled"].includes(invoice.status)) {
      return fail(issue("invalid_state", "Cannot pay a closed invoice"));
    }
    if (!(input.amount > 0)) {
      return fail(issue("invalid_amount", "Payment must be greater than zero", "amount"));
    }
    if (input.amount > invoice.amount) {
      return fail(
        issue("overpay", "Payment exceeds invoice amount", "amount")
      );
    }

    const now = input.now ?? new Date().toISOString();
    const payment: PaymentRecord = {
      id: newDomainId("pay"),
      displayName: input.displayName.trim() || `PAY-${invoice.id}`,
      invoiceId: invoice.id,
      amount: Number(input.amount.toFixed(2)),
      paidOn: input.paidOn,
      method: input.method ?? null,
      status: "payment",
      createdAt: now,
      updatedAt: now,
    };

    const fullyPaid = input.amount >= invoice.amount;
    return ok({
      payment,
      invoice: {
        ...invoice,
        status: fullyPaid ? "closed" : "payment",
        updatedAt: now,
      },
    });
  },

  createScholarship(input: {
    displayName: string;
    studentId: string;
    awardAmount: number;
    now?: string;
  }): DomainResult<ScholarshipRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Scholarship name is required", "displayName"));
    }
    if (!input.studentId?.trim()) {
      return fail(issue("required", "Student is required", "studentId"));
    }
    if (!(input.awardAmount > 0)) {
      return fail(
        issue("invalid_amount", "Award amount must be greater than zero", "awardAmount")
      );
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("awd"),
      displayName: input.displayName.trim(),
      studentId: input.studentId,
      awardAmount: Number(input.awardAmount.toFixed(2)),
      status: "application",
      awardedOn: null,
      createdAt: now,
      updatedAt: now,
    });
  },

  outstandingTuition(invoices: InvoiceRecord[]): number {
    return Number(
      invoices
        .filter((i) => !["closed", "cancelled"].includes(i.status))
        .reduce((sum, i) => sum + i.amount, 0)
        .toFixed(2)
    );
  },

  /**
   * Need-based scholarship estimate (pure domain rule).
   * UI / API must not reimplement this formula.
   */
  estimateScholarshipAward(input: {
    householdIncome: number;
    familySize: number;
    siblingCount: number;
    specialCircumstanceScore: number;
  }): number {
    let approvedAmount = 10000;
    if (input.householdIncome > 100000) approvedAmount -= 3000;
    else if (input.householdIncome > 60000) approvedAmount -= 1500;
    approvedAmount +=
      input.familySize * 250 +
      input.siblingCount * 500 +
      input.specialCircumstanceScore * 50;
    return Math.max(1000, Math.round(approvedAmount));
  },
};
