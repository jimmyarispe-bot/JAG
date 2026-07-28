/**
 * Scenario 2 — Family Financial Journey
 */

import { listJagPlatformEvents } from "@/lib/jag-platform/events";
import {
  buildEducationExecutiveDashboard,
  buildFinancialOperationsSummary,
  createFamilyAccountsService,
  createFinanceBillingService,
  createFinanceScholarshipService,
  createPaymentsService,
  createSisStudentsService,
  createTuitionService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const familyFinancialScenario: ScenarioDefinition = {
  id: "family_financial",
  name: "Family Financial Journey",
  domains: ["finance", "sis", "communications", "executive"],
  run(ctx) {
    const org = ctx.organizationId;

    const student = createSisStudentsService().create({
      organizationId: org,
      identity: {
        preferredName: "Alex",
        legalFirstName: "Alex",
        legalLastName: "Rivera",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "7",
      campusId: "c1",
      campusName: "Lincoln",
      program: "STEM",
      status: "Active",
      createdBy: "u1",
    });
    ctx.assert("family.student", isOk(student), undefined, "blocker");
    if (!isOk(student)) return;

    const plan = createTuitionService().createPlan({
      organizationId: org,
      name: "Monthly STEM",
      frequency: "Monthly",
      baseAmount: 1000,
      program: "STEM",
      campusId: "c1",
      effectiveFrom: "2026-01-01",
      promotionalDiscountPercent: 0,
      createdBy: "u1",
    });
    ctx.assert("finance.tuition_plan", isOk(plan), undefined, "blocker");
    if (!isOk(plan)) return;

    const account = createFamilyAccountsService().create({
      organizationId: org,
      displayName: "Rivera Family",
      responsibleParties: [
        { name: "Pat Rivera", email: `pat.${org}@example.com`, sharePercent: 100 },
      ],
      studentIds: [student.id],
      createdBy: "u1",
    });
    ctx.assert("finance.family_created", isOk(account), undefined, "blocker");
    if (!isOk(account)) return;

    createTuitionService().assignSchedule({
      organizationId: org,
      tuitionPlanId: plan.id,
      familyAccountId: account.id,
      studentId: student.id,
      startsOn: "2026-01-01",
      createdBy: "u1",
    });

    const award = createFinanceScholarshipService().award({
      organizationId: org,
      fundingSource: "Need-Based Grant",
      awardAmount: 200,
      familyAccountId: account.id,
      studentId: student.id,
      documentationComplete: true,
      createdBy: "u1",
    });
    ctx.assert("finance.scholarship", isOk(award));
    if (!isOk(award)) return;

    const invoice = ctx.measure("family_financial.invoice", () =>
      createFinanceBillingService().generateTuitionInvoice({
        organizationId: org,
        familyAccountId: account.id,
        studentId: student.id,
        periodMonth: "2026-07",
        createdBy: "u1",
      })
    );
    ctx.assert("finance.invoice", isOk(invoice), undefined, "blocker");
    if (!isOk(invoice)) return;
    ctx.assert("finance.scholarship_calc", invoice.scholarshipApplied === 200);
    ctx.assert("finance.balance_after_scholarship", invoice.totalAmount === 800);

    const invoiceNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "finance",
      eventKey: "invoice_issued",
      recipientType: "parent",
      recipientId: `pat.${org}@example.com`,
      studentId: student.id,
      familyId: account.id,
      variables: { amount: String(invoice.totalAmount), student: "Alex Rivera" },
      createdBy: "system",
    });
    ctx.assert(
      "communications.invoice_notification",
      Array.isArray(invoiceNotif) && invoiceNotif.length > 0
    );

    const payment = createPaymentsService().record({
      organizationId: org,
      familyAccountId: account.id,
      invoiceId: invoice.id,
      amount: 800,
      method: "Online",
      createdBy: "u1",
    });
    ctx.assert("finance.payment", isOk(payment), undefined, "blocker");
    if (!isOk(payment)) return;

    const paid = createFinanceBillingService().get(org, invoice.id);
    ctx.assert("finance.ledger_paid", paid?.status === "Paid" || paid?.balanceDue === 0);
    ctx.assert("finance.payment_allocation", (paid?.balanceDue ?? 1) === 0);

    const receiptNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "finance",
      eventKey: "payment_received",
      recipientType: "parent",
      recipientId: `pat.${org}@example.com`,
      familyId: account.id,
      createdBy: "system",
    });
    ctx.assert(
      "communications.receipt",
      Array.isArray(receiptNotif) && receiptNotif.length > 0
    );

    ctx.assert(
      "events.finance",
      listJagPlatformEvents({ organizationId: org }).some((e) =>
        e.eventType.includes("finance") || e.eventType.includes("academyos")
      )
    );

    const financeSummary = buildFinancialOperationsSummary(org);
    const dash = buildEducationExecutiveDashboard(org);
    ctx.assert(
      "executive.finance_insights",
      financeSummary != null && dash.financialOperationsSummary != null
    );
  },
};
