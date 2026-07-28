/**
 * Finance parent portal — invoices, payments, AutoPay, scholarships.
 */

import { findStudentByParentToken } from "../sis/store";
import { createFamilyAccountsService } from "./family-accounts";
import { findFamilyByStudent, listInvoices, listPayments } from "./store";
import { createPaymentsService } from "./payments";
import { createFinanceReportingService } from "./reporting";

export function createFinanceParentPortalService() {
  const accounts = createFamilyAccountsService();
  const payments = createPaymentsService();

  return {
    resolve(token: string) {
      const student = findStudentByParentToken(token);
      if (!student) return { error: "Invalid parent access token." as const };
      const account = findFamilyByStudent(
        student.organizationId,
        student.id
      );
      if (!account) {
        return {
          studentId: student.id,
          account: null,
          invoices: Object.freeze([]),
          payments: Object.freeze([]),
          scholarships: Object.freeze([]),
          outstandingBalance: 0,
          autoPayEnabled: false,
          paymentMethods: Object.freeze([]),
        };
      }
      const snap = accounts.snapshot(student.organizationId, account.id)!;
      return {
        studentId: student.id,
        account,
        invoices: snap.openInvoices,
        allInvoices: listInvoices(student.organizationId, {
          familyAccountId: account.id,
        }),
        payments: snap.paymentHistory,
        scholarships: snap.activeScholarships,
        outstandingBalance: snap.outstandingBalance,
        autoPayEnabled: snap.autoPayStatus,
        paymentMethods: snap.paymentMethods,
        credits: snap.credits,
      };
    },

    pay(input: {
      token: string;
      invoiceId: string;
      amount: number;
      method?: "Online" | "Manual" | "AutoPay";
    }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      const account = findFamilyByStudent(
        student.organizationId,
        student.id
      );
      if (!account) return { error: "No family financial account." };
      return payments.record({
        organizationId: student.organizationId,
        familyAccountId: account.id,
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method ?? "Online",
        processor: "parent-portal",
        createdBy: `parent:${input.token.slice(0, 8)}`,
      });
    },

    setAutoPay(input: { token: string; enabled: boolean }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      const account = findFamilyByStudent(
        student.organizationId,
        student.id
      );
      if (!account) return { error: "No family financial account." };
      return accounts.patch({
        organizationId: student.organizationId,
        accountId: account.id,
        autoPayEnabled: input.enabled,
        actor: `parent:${input.token.slice(0, 8)}`,
      });
    },

    addPaymentMethod(input: {
      token: string;
      label: string;
      kind?: "Online" | "Manual";
      lastFour?: string;
    }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      const account = findFamilyByStudent(
        student.organizationId,
        student.id
      );
      if (!account) return { error: "No family financial account." };
      return accounts.addPaymentMethod({
        organizationId: student.organizationId,
        familyAccountId: account.id,
        kind: input.kind ?? "Online",
        label: input.label,
        lastFour: input.lastFour,
        isDefault: true,
        createdBy: `parent:${input.token.slice(0, 8)}`,
      });
    },

    statement(input: { token: string }) {
      const student = findStudentByParentToken(input.token);
      if (!student) return { error: "Invalid parent access token." };
      const account = findFamilyByStudent(
        student.organizationId,
        student.id
      );
      if (!account) return { error: "No family financial account." };
      const report = createFinanceReportingService().generate(
        student.organizationId,
        "family_statements"
      );
      const paymentsHist = listPayments(student.organizationId, {
        familyAccountId: account.id,
      });
      return {
        account,
        report,
        payments: paymentsHist,
        csv: report.csv,
        pdf: report.pdf,
      };
    },
  };
}
