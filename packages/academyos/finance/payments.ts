import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { roundMoney } from "./config";
import { createBillingService } from "./billing";
import { emitFinanceEvent } from "./events";
import {
  getFamilyAccount,
  getInvoice,
  listPayments,
  upsertCredit,
  upsertFamilyAccount,
  upsertPayment,
} from "./store";
import type {
  FinanceCredit,
  FinancePayment,
  PaymentMethodKind,
  PaymentStatus,
} from "./types";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "./types";

export function createPaymentsService() {
  const billing = createBillingService();

  return {
    record(input: {
      organizationId: string;
      familyAccountId: string;
      invoiceId?: string | null;
      amount: number;
      method: PaymentMethodKind;
      reference?: string | null;
      processor?: string | null;
      paidOn?: string;
      status?: PaymentStatus;
      createdBy: string;
      useCredit?: boolean;
    }): FinancePayment | { error: string } {
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      if (input.amount <= 0) return { error: "amount must be > 0." };
      if (!(PAYMENT_METHODS as readonly string[]).includes(input.method)) {
        return { error: "Invalid payment method." };
      }

      let amount = roundMoney(input.amount);
      if (input.useCredit && account.creditBalance > 0) {
        const fromCredit = Math.min(account.creditBalance, amount);
        upsertFamilyAccount({
          ...account,
          creditBalance: roundMoney(account.creditBalance - fromCredit),
          updatedAt: new Date().toISOString(),
        });
      }

      if (input.invoiceId) {
        const inv = getInvoice(input.organizationId, input.invoiceId);
        if (!inv) return { error: "Invoice not found." };
        if (inv.familyAccountId !== account.id) {
          return { error: "Invoice does not belong to this family account." };
        }
        if (amount > inv.balanceDue) {
          amount = inv.balanceDue;
        }
      }

      const status = input.status ?? "Completed";
      if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) {
        return { error: "Invalid payment status." };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Payment",
        twinEntityType: "Document",
        id,
        label: `Payment ${amount}`,
        kind: "finance_payment",
        actor: input.createdBy,
      });

      const payment = upsertPayment({
        id,
        organizationId: input.organizationId,
        familyAccountId: account.id,
        invoiceId: input.invoiceId ?? null,
        amount,
        method: input.method,
        status,
        reference: input.reference ?? null,
        processor: input.processor ?? null,
        paidOn: (input.paidOn ?? now).slice(0, 10),
        isRefund: false,
        twinEntityId: twinId,
        quickbooksSyncId: null,
        createdAt: now,
        createdBy: input.createdBy,
      });

      if (status === "Completed" && input.invoiceId) {
        billing.applyPaymentToInvoice(
          input.organizationId,
          input.invoiceId,
          amount
        );
      }

      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FinancePayment",
        entityId: id,
        eventType: "payment_recorded",
        actor: input.createdBy,
        metadata: {
          amount: String(amount),
          method: input.method,
          invoiceId: input.invoiceId ?? "",
        },
      });
      return payment;
    },

    autoPay(input: {
      organizationId: string;
      familyAccountId: string;
      invoiceId: string;
      createdBy: string;
    }) {
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      if (!account.autoPayEnabled) {
        return { error: "AutoPay is not enabled for this account." };
      }
      const inv = getInvoice(input.organizationId, input.invoiceId);
      if (!inv || inv.balanceDue <= 0) {
        return { error: "No balance due on invoice." };
      }
      return this.record({
        organizationId: input.organizationId,
        familyAccountId: input.familyAccountId,
        invoiceId: input.invoiceId,
        amount: inv.balanceDue,
        method: "AutoPay",
        processor: "academyos-autopay",
        createdBy: input.createdBy,
      });
    },

    refund(input: {
      organizationId: string;
      familyAccountId: string;
      amount: number;
      reference?: string | null;
      createdBy: string;
      invoiceId?: string | null;
    }): FinancePayment | { error: string } {
      if (input.amount <= 0) return { error: "amount must be > 0." };
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      const now = new Date().toISOString();
      const id = randomUUID();
      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Payment",
        twinEntityType: "Document",
        id,
        label: `Refund ${input.amount}`,
        kind: "finance_refund",
        actor: input.createdBy,
      });
      const payment = upsertPayment({
        id,
        organizationId: input.organizationId,
        familyAccountId: account.id,
        invoiceId: input.invoiceId ?? null,
        amount: roundMoney(input.amount),
        method: "Refund",
        status: "Refunded",
        reference: input.reference ?? null,
        processor: null,
        paidOn: now.slice(0, 10),
        isRefund: true,
        twinEntityId: twinId,
        quickbooksSyncId: null,
        createdAt: now,
        createdBy: input.createdBy,
      });
      emitFinanceEvent({
        organizationId: input.organizationId,
        entityType: "FinancePayment",
        entityId: id,
        eventType: "refund_recorded",
        actor: input.createdBy,
      });
      return payment;
    },

    addCredit(input: {
      organizationId: string;
      familyAccountId: string;
      amount: number;
      reason: string;
      createdBy: string;
    }): FinanceCredit | { error: string } {
      const account = getFamilyAccount(
        input.organizationId,
        input.familyAccountId
      );
      if (!account) return { error: "Family account not found." };
      if (input.amount <= 0) return { error: "amount must be > 0." };
      const amount = roundMoney(input.amount);
      const credit = upsertCredit({
        id: randomUUID(),
        organizationId: input.organizationId,
        familyAccountId: account.id,
        amount,
        reason: input.reason,
        remaining: amount,
        twinEntityId: projectAcademyEntityToTwin({
          organizationId: input.organizationId,
          academyEntity: "Payment",
          twinEntityType: "Document",
          id: randomUUID(),
          label: `Credit ${amount}`,
          kind: "finance_credit",
          actor: input.createdBy,
        }),
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      });
      upsertFamilyAccount({
        ...account,
        creditBalance: roundMoney(account.creditBalance + amount),
        updatedAt: new Date().toISOString(),
      });
      return credit;
    },

    list: listPayments,
  };
}
