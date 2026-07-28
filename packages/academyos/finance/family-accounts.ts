import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { emitFinanceEvent } from "./events";
import {
  getFamilyAccount,
  listCredits,
  listFamilyAccounts,
  listInvoices,
  listPaymentMethods,
  listPayments,
  listScholarshipAwards,
  upsertFamilyAccount,
  upsertPaymentMethod,
} from "./store";
import type {
  FamilyFinancialAccount,
  PaymentMethodKind,
  ResponsibleParty,
} from "./types";

export function createFamilyAccountsService() {
  return {
    create(input: {
      organizationId: string;
      displayName: string;
      responsibleParties: readonly Omit<ResponsibleParty, "id">[];
      studentIds?: readonly string[];
      siblingDiscountStudentId?: string | null;
      createdBy: string;
    }): FamilyFinancialAccount | { error: string } {
      if (!input.displayName.trim()) {
        return { error: "displayName is required." };
      }
      if (!input.responsibleParties.length) {
        return { error: "At least one responsible party is required." };
      }
      const share = input.responsibleParties.reduce(
        (a, p) => a + p.sharePercent,
        0
      );
      if (Math.abs(share - 100) > 0.01) {
        return { error: "Responsible party sharePercent must total 100." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Family Account",
        twinEntityType: "Organization",
        id,
        label: input.displayName.trim(),
        kind: "family_financial_account",
        actor: input.createdBy,
      });

      const account = upsertFamilyAccount({
        id,
        organizationId: input.organizationId,
        accountNumber: `FA-${id.slice(0, 8).toUpperCase()}`,
        displayName: input.displayName.trim(),
        responsibleParties: Object.freeze(
          input.responsibleParties.map((p) => ({
            id: randomUUID(),
            name: p.name,
            email: p.email ?? null,
            sharePercent: p.sharePercent,
          }))
        ),
        studentIds: Object.freeze([...(input.studentIds ?? [])]),
        tuitionPlanIds: Object.freeze([]),
        scholarshipAwardIds: Object.freeze([]),
        paymentMethodIds: Object.freeze([]),
        autoPayEnabled: false,
        siblingDiscountStudentId: input.siblingDiscountStudentId ?? null,
        creditBalance: 0,
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      });

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FamilyFinancialAccount",
        entityId: id,
        eventType: "family_account_created",
        actor: input.createdBy,
      });
      return account;
    },

    get: getFamilyAccount,
    list: listFamilyAccounts,

    patch(input: {
      organizationId: string;
      accountId: string;
      displayName?: string;
      studentIds?: readonly string[];
      siblingDiscountStudentId?: string | null;
      autoPayEnabled?: boolean;
      tuitionPlanIds?: readonly string[];
      actor: string;
    }): FamilyFinancialAccount | null {
      const current = getFamilyAccount(input.organizationId, input.accountId);
      if (!current) return null;
      const next = upsertFamilyAccount({
        ...current,
        displayName: input.displayName?.trim() || current.displayName,
        studentIds: input.studentIds
          ? Object.freeze([...input.studentIds])
          : current.studentIds,
        siblingDiscountStudentId:
          input.siblingDiscountStudentId !== undefined
            ? input.siblingDiscountStudentId
            : current.siblingDiscountStudentId,
        autoPayEnabled: input.autoPayEnabled ?? current.autoPayEnabled,
        tuitionPlanIds: input.tuitionPlanIds
          ? Object.freeze([...input.tuitionPlanIds])
          : current.tuitionPlanIds,
        updatedAt: new Date().toISOString(),
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FamilyFinancialAccount",
        entityId: next.id,
        eventType: "family_account_updated",
        actor: input.actor,
      });
      return next;
    },

    addPaymentMethod(input: {
      organizationId: string;
      familyAccountId: string;
      kind: PaymentMethodKind;
      label: string;
      lastFour?: string | null;
      isDefault?: boolean;
      createdBy: string;
    }) {
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      const method = upsertPaymentMethod({
        id: randomUUID(),
        organizationId: input.organizationId,
        familyAccountId: account.id,
        kind: input.kind,
        label: input.label.trim(),
        lastFour: input.lastFour ?? null,
        isDefault: input.isDefault ?? false,
        createdAt: new Date().toISOString(),
      });
      upsertFamilyAccount({
        ...account,
        paymentMethodIds: Object.freeze([
          ...account.paymentMethodIds,
          method.id,
        ]),
        updatedAt: new Date().toISOString(),
      });
      return method;
    },

    /** Snapshot used by parent portal and statements. */
    snapshot(organizationId: string, accountId: string) {
      const account = getFamilyAccount(organizationId, accountId);
      if (!account) return null;
      const invoices = listInvoices(organizationId, {
        familyAccountId: accountId,
      });
      const openInvoices = invoices.filter(
        (i) =>
          i.status === "Issued" ||
          i.status === "Partially Paid" ||
          i.status === "Overdue"
      );
      const outstandingBalance = openInvoices.reduce(
        (a, i) => a + i.balanceDue,
        0
      );
      return {
        account,
        tuitionPlans: account.tuitionPlanIds,
        activeScholarships: listScholarshipAwards(organizationId, {
          familyAccountId: accountId,
        }).filter((s) => s.status === "Active"),
        openInvoices,
        paymentHistory: listPayments(organizationId, {
          familyAccountId: accountId,
        }),
        credits: listCredits(organizationId, accountId),
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        paymentMethods: listPaymentMethods(organizationId, accountId),
        autoPayStatus: account.autoPayEnabled,
      };
    },
  };
}
