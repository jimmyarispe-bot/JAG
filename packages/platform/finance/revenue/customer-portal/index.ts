import { listAttachments } from "../../attachments";
import { listInvoices, listPayments } from "../../store";
import type { CustomerPortalView } from "../types";

export function buildCustomerPortal(input: {
  organizationId: string;
  customerId: string;
}): CustomerPortalView {
  const invoices = listInvoices(input.organizationId).filter(
    (i) => i.customerId === input.customerId && !i.credit
  );
  const payments = listPayments(input.organizationId).filter(
    (p) => p.customerId === input.customerId && p.direction === "in"
  );
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce((s, i) => {
      const paid = payments
        .filter((p) => p.invoiceId === i.id)
        .reduce((a, p) => a + p.amount, 0);
      return s + Math.max(0, i.amount - paid);
    }, 0);

  const documents = listAttachments(input.organizationId)
    .filter(
      (a) =>
        a.linkedRecordType === "invoice" &&
        invoices.some((i) => i.id === a.linkedRecordId)
    )
    .map((a) => Object.freeze({ id: a.id, fileName: a.fileName }));

  return Object.freeze({
    customerId: input.customerId,
    organizationId: input.organizationId,
    invoices: Object.freeze(
      invoices.map((i) =>
        Object.freeze({
          id: i.id,
          amount: i.amount,
          status: i.status,
          dueAt: i.dueAt,
        })
      )
    ),
    payments: Object.freeze(
      payments.map((p) =>
        Object.freeze({
          id: p.id,
          amount: p.amount,
          paidAt: p.paidAt,
        })
      )
    ),
    outstandingBalance: outstanding,
    paymentLinkHint: `/portal/finance/pay?customerId=${encodeURIComponent(input.customerId)}`,
    documents: Object.freeze(documents),
  });
}
