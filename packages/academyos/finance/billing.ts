import { randomUUID } from "node:crypto";
import { getStudent } from "../sis/store";
import { projectAcademyEntityToTwin } from "../twin/project";
import {
  dueDateForPeriod,
  lateFeeStartDate,
  roundMoney,
} from "./config";
import { emitFinanceEvent } from "./events";
import {
  getBillingConfig,
  getFamilyAccount,
  getInvoice,
  getTuitionPlan,
  listInvoices,
  listScholarshipAwards,
  listTuitionSchedules,
  setBillingConfig,
  upsertFamilyAccount,
  upsertInvoice,
  upsertScholarshipAward,
} from "./store";
import type {
  FinanceBillingConfig,
  FinanceInvoice,
  InvoiceCategory,
  InvoiceLine,
  InvoiceStatus,
} from "./types";
import { INVOICE_CATEGORIES, INVOICE_STATUSES } from "./types";

function invoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function recomputeStatus(inv: FinanceInvoice): InvoiceStatus {
  if (
    inv.status === "Cancelled" ||
    inv.status === "Written Off" ||
    inv.status === "Draft"
  ) {
    return inv.status;
  }
  if (inv.balanceDue <= 0) return "Paid";
  if (inv.amountPaid > 0 && inv.balanceDue > 0) return "Partially Paid";
  const today = new Date().toISOString().slice(0, 10);
  if (today > inv.dueOn) return "Overdue";
  return "Issued";
}

export function createBillingService() {
  return {
    configure(
      organizationId: string,
      partial: Partial<FinanceBillingConfig>
    ): FinanceBillingConfig {
      const next = Object.freeze({
        ...getBillingConfig(organizationId),
        ...partial,
      });
      return setBillingConfig(organizationId, next);
    },

    getConfig: getBillingConfig,

    generateTuitionInvoice(input: {
      organizationId: string;
      familyAccountId: string;
      studentId: string;
      tuitionPlanId?: string;
      periodMonth: string;
      category?: InvoiceCategory;
      extraLines?: readonly Omit<InvoiceLine, "id">[];
      createdBy: string;
      issue?: boolean;
    }): FinanceInvoice | { error: string } {
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      if (!account.studentIds.includes(input.studentId)) {
        return { error: "Student is not linked to this family account." };
      }
      const student = getStudent(input.organizationId, input.studentId);
      if (!student) return { error: "Student not found." };

      const config = getBillingConfig(input.organizationId);
      const schedules = listTuitionSchedules(
        input.organizationId,
        account.id
      ).filter((s) => s.studentId === input.studentId && s.active);
      const schedule = schedules[0];
      const planId =
        input.tuitionPlanId ??
        schedule?.tuitionPlanId ??
        account.tuitionPlanIds[0];
      if (!planId) return { error: "No tuition plan assigned." };
      const plan = getTuitionPlan(input.organizationId, planId);
      if (!plan) return { error: "Tuition plan not found." };

      const base = schedule?.amount ?? plan.baseAmount;
      const promoPct = plan.promotionalDiscountPercent;
      const promotionalDiscountAmount = roundMoney((base * promoPct) / 100);

      const siblingPct =
        plan.siblingDiscountPercent ?? config.siblingDiscountPercent;
      let siblingDiscountAmount = 0;
      const eligibleSibling =
        account.studentIds.length > 1 &&
        (!config.siblingDiscountOneStudentOnly ||
          account.siblingDiscountStudentId === input.studentId ||
          (account.siblingDiscountStudentId == null &&
            account.studentIds[0] === input.studentId));
      if (eligibleSibling && siblingPct > 0) {
        siblingDiscountAmount = roundMoney((base * siblingPct) / 100);
      }

      let afterDiscounts = roundMoney(
        base - promotionalDiscountAmount - siblingDiscountAmount
      );
      if (afterDiscounts < 0) afterDiscounts = 0;

      // Scholarships reduce balances before family responsibility
      let scholarshipApplied = 0;
      const awards = listScholarshipAwards(input.organizationId, {
        familyAccountId: account.id,
      }).filter(
        (a) =>
          a.status === "Active" &&
          a.remainingBalance > 0 &&
          (a.studentId == null || a.studentId === input.studentId)
      );

      if (config.scholarshipAppliesBeforeFamilyResponsibility) {
        for (const award of awards) {
          if (afterDiscounts <= 0) break;
          const apply = Math.min(award.remainingBalance, afterDiscounts);
          scholarshipApplied = roundMoney(scholarshipApplied + apply);
          afterDiscounts = roundMoney(afterDiscounts - apply);
          upsertScholarshipAward({
            ...award,
            remainingBalance: roundMoney(award.remainingBalance - apply),
            status:
              award.remainingBalance - apply <= 0 ? "Exhausted" : "Active",
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const extra = (input.extraLines ?? []).map((l) => ({
        id: randomUUID(),
        category: l.category,
        description: l.description,
        amount: l.amount,
      }));
      const extraTotal = extra.reduce((a, l) => a + l.amount, 0);
      const lines: InvoiceLine[] = [
        {
          id: randomUUID(),
          category: input.category ?? "Tuition",
          description: `${plan.name} — ${input.periodMonth}`,
          amount: base,
        },
        ...extra,
      ];

      const subtotal = roundMoney(base + extraTotal);
      const totalAmount = roundMoney(afterDiscounts + extraTotal);
      const dueOn = dueDateForPeriod(
        input.periodMonth,
        schedule?.dueDay ?? config.monthlyDueDay
      );
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Invoice",
        twinEntityType: "Document",
        id,
        label: `Invoice ${input.periodMonth}`,
        kind: "finance_invoice",
        actor: input.createdBy,
      });

      const status: InvoiceStatus = input.issue === false ? "Draft" : "Issued";
      const invoice = upsertInvoice({
        id,
        organizationId: input.organizationId,
        familyAccountId: account.id,
        studentId: input.studentId,
        invoiceNumber: invoiceNumber(),
        category: input.category ?? "Tuition",
        lines: Object.freeze(lines),
        subtotal,
        siblingDiscountAmount,
        promotionalDiscountAmount,
        scholarshipApplied,
        lateFeeAmount: 0,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        status,
        issuedOn: status === "Issued" ? now.slice(0, 10) : null,
        dueOn,
        periodMonth: input.periodMonth,
        twinEntityId: twinId,
        quickbooksSyncId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      if (!account.tuitionPlanIds.includes(plan.id)) {
        upsertFamilyAccount({
          ...account,
          tuitionPlanIds: Object.freeze([...account.tuitionPlanIds, plan.id]),
          updatedAt: now,
        });
      }

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FinanceInvoice",
        entityId: id,
        eventType: "invoice_generated",
        actor: input.createdBy,
        metadata: {
          status,
          totalAmount: String(totalAmount),
          scholarshipApplied: String(scholarshipApplied),
        },
      });
      return invoice;
    },

    createCharge(input: {
      organizationId: string;
      familyAccountId: string;
      studentId?: string | null;
      category: InvoiceCategory;
      description: string;
      amount: number;
      dueOn: string;
      createdBy: string;
      issue?: boolean;
    }): FinanceInvoice | { error: string } {
      if (!(INVOICE_CATEGORIES as readonly string[]).includes(input.category)) {
        return { error: "Invalid invoice category." };
      }
      if (!getFamilyAccount(input.organizationId, input.familyAccountId)) {
        return { error: "Family account not found." };
      }
      if (input.amount <= 0) return { error: "amount must be > 0." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Invoice",
        twinEntityType: "Document",
        id,
        label: input.description,
        kind: "finance_invoice",
        actor: input.createdBy,
      });
      const status: InvoiceStatus = input.issue === false ? "Draft" : "Issued";
      const amount = roundMoney(input.amount);
      return upsertInvoice({
        id,
        organizationId: input.organizationId,
        familyAccountId: input.familyAccountId,
        studentId: input.studentId ?? null,
        invoiceNumber: invoiceNumber(),
        category: input.category,
        lines: Object.freeze([
          {
            id: randomUUID(),
            category: input.category,
            description: input.description,
            amount,
          },
        ]),
        subtotal: amount,
        siblingDiscountAmount: 0,
        promotionalDiscountAmount: 0,
        scholarshipApplied: 0,
        lateFeeAmount: 0,
        totalAmount: amount,
        amountPaid: 0,
        balanceDue: amount,
        status,
        issuedOn: status === "Issued" ? now.slice(0, 10) : null,
        dueOn: input.dueOn.slice(0, 10),
        periodMonth: null,
        twinEntityId: twinId,
        quickbooksSyncId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });
    },

    /**
     * Apply late fees for unpaid invoices past month-end per config.
     * Beginning on the 1st after the billing month, daily late fee up to max days.
     */
    applyLateFees(input: {
      organizationId: string;
      asOf?: string;
      actor: string;
    }): readonly FinanceInvoice[] {
      const config = getBillingConfig(input.organizationId);
      const asOf = (input.asOf ?? new Date().toISOString()).slice(0, 10);
      const updated: FinanceInvoice[] = [];

      for (const inv of listInvoices(input.organizationId)) {
        if (
          !inv.periodMonth ||
          inv.balanceDue <= 0 ||
          inv.status === "Cancelled" ||
          inv.status === "Written Off" ||
          inv.status === "Paid" ||
          inv.status === "Draft"
        ) {
          continue;
        }
        const start = lateFeeStartDate(inv.periodMonth);
        if (asOf < start) continue;
        const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
        const asOfMs = new Date(`${asOf}T00:00:00.000Z`).getTime();
        const days = Math.min(
          config.lateFeeMaxDays,
          Math.floor((asOfMs - startMs) / 86_400_000) + 1
        );
        if (days <= 0) continue;
        const expectedFee = roundMoney(days * config.lateFeeDailyAmount);
        if (expectedFee <= inv.lateFeeAmount) continue;

        const delta = roundMoney(expectedFee - inv.lateFeeAmount);
        const next = upsertInvoice({
          ...inv,
          lateFeeAmount: expectedFee,
          totalAmount: roundMoney(inv.totalAmount + delta),
          balanceDue: roundMoney(inv.balanceDue + delta),
          lines: Object.freeze([
            ...inv.lines,
            {
              id: randomUUID(),
              category: "Late Fee" as InvoiceCategory,
              description: `Late fee through ${asOf}`,
              amount: delta,
            },
          ]),
          status: "Overdue",
          updatedAt: new Date().toISOString(),
        });
        updated.push(next);
        emitFinanceEvent({
          organizationId: input.organizationId,
          entityType: "FinanceInvoice",
          entityId: next.id,
          eventType: "late_fee_applied",
          actor: input.actor,
          metadata: { amount: String(delta) },
        });
      }
      return Object.freeze(updated);
    },

    /** Reminder candidates: unpaid between due day and month end. */
    reminderCandidates(
      organizationId: string,
      asOf = new Date().toISOString().slice(0, 10)
    ) {
      const config = getBillingConfig(organizationId);
      if (!config.reminderUntilMonthEnd) return Object.freeze([]);
      const day = Number(asOf.slice(8, 10));
      if (day < config.monthlyDueDay) return Object.freeze([]);
      return Object.freeze(
        listInvoices(organizationId).filter(
          (i) =>
            i.balanceDue > 0 &&
            (i.status === "Issued" || i.status === "Partially Paid") &&
            i.dueOn.slice(0, 7) === asOf.slice(0, 7)
        )
      );
    },

    get: getInvoice,
    list: listInvoices,

    transition(input: {
      organizationId: string;
      invoiceId: string;
      status: InvoiceStatus;
      actor: string;
    }): FinanceInvoice | { error: string } | null {
      const current = getInvoice(input.organizationId, input.invoiceId);
      if (!current) return null;
      if (!(INVOICE_STATUSES as readonly string[]).includes(input.status)) {
        return { error: "Invalid invoice status." };
      }
      const next = upsertInvoice({
        ...current,
        status: input.status,
        issuedOn:
          input.status === "Issued" && !current.issuedOn
            ? new Date().toISOString().slice(0, 10)
            : current.issuedOn,
        updatedAt: new Date().toISOString(),
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FinanceInvoice",
        entityId: next.id,
        eventType: "invoice_status_changed",
        actor: input.actor,
        metadata: { status: input.status },
      });
      return next;
    },

    /** Internal helper after payment. */
    applyPaymentToInvoice(
      organizationId: string,
      invoiceId: string,
      amount: number
    ): FinanceInvoice | null {
      const current = getInvoice(organizationId, invoiceId);
      if (!current) return null;
      const amountPaid = roundMoney(current.amountPaid + amount);
      const balanceDue = roundMoney(
        Math.max(0, current.totalAmount - amountPaid)
      );
      const partial = {
        ...current,
        amountPaid,
        balanceDue,
        updatedAt: new Date().toISOString(),
      };
      const status = recomputeStatus(partial as FinanceInvoice);
      return upsertInvoice({ ...partial, status });
    },
  };
}
