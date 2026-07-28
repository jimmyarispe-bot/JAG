import { listBanks } from "../../store";
import { listTransactions, listTransferRequests } from "../store";

/** Operational banking exports (not financial analysis). */
export function exportBankingSnapshot(organizationId: string): {
  readonly exportedAt: string;
  readonly accounts: readonly {
    id: string;
    name: string;
    kind: string;
    currency: string;
    currentBalance: number;
  }[];
  readonly transactions: readonly {
    id: string;
    bankAccountId: string;
    amount: number;
    status: string;
    description: string;
  }[];
  readonly transfers: readonly {
    id: string;
    kind: string;
    status: string;
    amount: number;
  }[];
} {
  return Object.freeze({
    exportedAt: new Date().toISOString(),
    accounts: Object.freeze(
      listBanks(organizationId).map((a) =>
        Object.freeze({
          id: a.id,
          name: a.name,
          kind: a.kind,
          currency: a.currency,
          currentBalance: a.currentBalance ?? 0,
        })
      )
    ),
    transactions: Object.freeze(
      listTransactions(organizationId).map((t) =>
        Object.freeze({
          id: t.id,
          bankAccountId: t.bankAccountId,
          amount: t.amount,
          status: t.status,
          description: t.description,
        })
      )
    ),
    transfers: Object.freeze(
      listTransferRequests(organizationId).map((t) =>
        Object.freeze({
          id: t.id,
          kind: t.kind,
          status: t.status,
          amount: t.amount,
        })
      )
    ),
  });
}
