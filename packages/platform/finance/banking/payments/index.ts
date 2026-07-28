/**
 * Outbound/inbound payment placeholders tied to treasury rails.
 * Full AP/AR payment posting remains in Finance Foundation payables/receivables.
 */

import { describePaymentRails } from "../transfers";
import { notifyBanking } from "../notifications";

export function registerReturnedPayment(input: {
  organizationId: string;
  paymentRef: string;
  reason: string;
}): { readonly recorded: true; readonly paymentRef: string } {
  notifyBanking({
    organizationId: input.organizationId,
    kind: "returned_payment",
    message: `Returned payment ${input.paymentRef}: ${input.reason}`,
  });
  return Object.freeze({ recorded: true as const, paymentRef: input.paymentRef });
}

export function paymentRails() {
  return describePaymentRails();
}
