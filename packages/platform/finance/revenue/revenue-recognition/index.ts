import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import {
  getInvoiceMeta,
  listRecognition,
  upsertInvoiceMeta,
  upsertRecognition,
  getContract,
} from "../store";
import type { RecognitionBasis, RecognitionEntry } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";
import { listInvoices } from "../../store";

export function recognizeRevenue(input: {
  organizationId: string;
  userId: string;
  amount: number;
  basis: RecognitionBasis;
  kind: RecognitionEntry["kind"];
  invoiceId?: string | null;
  contractId?: string | null;
  memo?: string;
  currency?: string;
}): RecognitionEntry | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "post",
  });
  if ("error" in gate) return gate;
  if (input.amount <= 0) return { error: "Recognition amount must be positive." };
  if (input.contractId && !getContract(input.contractId)) {
    return { error: "Contract not found." };
  }
  if (input.invoiceId) {
    const inv = listInvoices(input.organizationId).find(
      (i) => i.id === input.invoiceId
    );
    if (!inv) return { error: "Invoice not found." };
    const meta = getInvoiceMeta(input.invoiceId);
    if (meta) {
      const recognized = meta.recognizedAmount + input.amount;
      const deferred = Math.max(0, meta.deferredAmount - input.amount);
      upsertInvoiceMeta({
        ...meta,
        recognizedAmount: recognized,
        deferredAmount: deferred,
      });
    }
  }

  const entry = upsertRecognition({
    id: `rrec:${randomUUID()}`,
    organizationId: input.organizationId,
    invoiceId: input.invoiceId ?? null,
    contractId: input.contractId ?? null,
    basis: input.basis,
    kind: input.kind,
    amount: input.amount,
    currency: (input.currency as RecognitionEntry["currency"]) ?? "USD",
    recognizedAt: new Date().toISOString(),
    memo: input.memo ?? "",
  });
  publishOperationalFinanceEvent({
    type: "finance.revenue_recognized",
    organizationId: input.organizationId,
    recordType: "recognition",
    recordId: entry.id,
    actorUserId: input.userId,
    payload: {
      amount: entry.amount,
      basis: entry.basis,
      kind: entry.kind,
      invoiceId: entry.invoiceId,
    },
  });
  return entry;
}

export function deferRevenue(input: {
  organizationId: string;
  userId: string;
  invoiceId: string;
  amount: number;
}): RecognitionEntry | { error: string } {
  return recognizeRevenue({
    ...input,
    basis: "accrual",
    kind: "deferred",
    memo: "Deferred revenue",
  });
}

export function recognitionSummary(organizationId: string): {
  readonly deferred: number;
  readonly recognized: number;
  readonly cash: number;
  readonly grant: number;
  readonly subscription: number;
} {
  const entries = listRecognition(organizationId);
  const sum = (kind: RecognitionEntry["kind"]) =>
    entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0);
  return Object.freeze({
    deferred: sum("deferred"),
    recognized: sum("recognized") + sum("contract"),
    cash: sum("cash"),
    grant: sum("grant"),
    subscription: sum("subscription"),
  });
}

export { listRecognition };
