import { getStudent } from "../sis/store";
import {
  listFamilyAccounts,
  listInvoices,
  listPayments,
  listScholarshipAwards,
} from "./store";
import type {
  AgingBucket,
  FinancialOperationsSummary,
} from "./types";

/** Mutable scratch pad for aging totals — not the public AgingBucket contract. */
type AgingBucketAccumulator = {
  -readonly [K in keyof AgingBucket]: number;
};

function agingBuckets(
  organizationId: string,
  asOf = new Date()
): AgingBucket {
  const today = asOf.toISOString().slice(0, 10);
  const todayMs = new Date(`${today}T00:00:00.000Z`).getTime();
  const buckets: AgingBucketAccumulator = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90Plus: 0,
  };

  for (const inv of listInvoices(organizationId)) {
    if (inv.balanceDue <= 0) continue;
    if (
      inv.status === "Cancelled" ||
      inv.status === "Written Off" ||
      inv.status === "Draft" ||
      inv.status === "Paid"
    ) {
      continue;
    }
    const dueMs = new Date(`${inv.dueOn}T00:00:00.000Z`).getTime();
    const days = Math.floor((todayMs - dueMs) / 86_400_000);
    if (days <= 0) buckets.current += inv.balanceDue;
    else if (days <= 30) buckets.days1to30 += inv.balanceDue;
    else if (days <= 60) buckets.days31to60 += inv.balanceDue;
    else if (days <= 90) buckets.days61to90 += inv.balanceDue;
    else buckets.days90Plus += inv.balanceDue;
  }

  const result: AgingBucket = {
    current: Math.round(buckets.current * 100) / 100,
    days1to30: Math.round(buckets.days1to30 * 100) / 100,
    days31to60: Math.round(buckets.days31to60 * 100) / 100,
    days61to90: Math.round(buckets.days61to90 * 100) / 100,
    days90Plus: Math.round(buckets.days90Plus * 100) / 100,
  };
  return result;
}

export function buildFinancialOperationsSummary(
  organizationId: string,
  now = new Date()
): FinancialOperationsSummary {
  const month = now.toISOString().slice(0, 7);
  const invoices = listInvoices(organizationId);
  const payments = listPayments(organizationId).filter(
    (p) => p.status === "Completed" && !p.isRefund
  );
  const awards = listScholarshipAwards(organizationId);

  const open = invoices.filter(
    (i) =>
      i.balanceDue > 0 &&
      i.status !== "Cancelled" &&
      i.status !== "Written Off" &&
      i.status !== "Draft"
  );
  const accountsReceivable = open.reduce((a, i) => a + i.balanceDue, 0);
  const outstandingTuition = open
    .filter((i) => i.category === "Tuition")
    .reduce((a, i) => a + i.balanceDue, 0);

  const monthPayments = payments.filter((p) => p.paidOn.startsWith(month));
  const currentMonthRevenue = monthPayments.reduce((a, p) => a + p.amount, 0);
  const collections = payments.reduce((a, p) => a + p.amount, 0);

  const issued = invoices.filter((i) => i.status !== "Draft");
  const paidFully = issued.filter((i) => i.status === "Paid").length;
  const paymentRate =
    issued.length === 0
      ? 100
      : Math.round((paidFully / issued.length) * 1000) / 10;

  const scholarshipFunding = awards.reduce((a, s) => a + s.awardAmount, 0);
  const enrollmentRevenue = invoices
    .filter((i) => i.category === "Tuition" && i.status !== "Cancelled")
    .reduce((a, i) => a + i.amountPaid, 0);

  const revenueByCampus: Record<string, number> = {};
  const revenueByProgram: Record<string, number> = {};
  for (const p of payments) {
    const inv = p.invoiceId
      ? invoices.find((i) => i.id === p.invoiceId)
      : null;
    const student = inv?.studentId
      ? getStudent(organizationId, inv.studentId)
      : null;
    const campus = student?.campusName ?? "Unassigned";
    const program = student?.program ?? "General";
    revenueByCampus[campus] = Math.round(
      ((revenueByCampus[campus] ?? 0) + p.amount) * 100
    ) / 100;
    revenueByProgram[program] = Math.round(
      ((revenueByProgram[program] ?? 0) + p.amount) * 100
    ) / 100;
  }

  void listFamilyAccounts(organizationId);

  return {
    organizationId,
    accountsReceivable: Math.round(accountsReceivable * 100) / 100,
    currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
    outstandingTuition: Math.round(outstandingTuition * 100) / 100,
    scholarshipFunding: Math.round(scholarshipFunding * 100) / 100,
    collections: Math.round(collections * 100) / 100,
    aging: agingBuckets(organizationId, now),
    paymentRate,
    enrollmentRevenue: Math.round(enrollmentRevenue * 100) / 100,
    revenueByCampus: Object.freeze(revenueByCampus),
    revenueByProgram: Object.freeze(revenueByProgram),
  };
}
