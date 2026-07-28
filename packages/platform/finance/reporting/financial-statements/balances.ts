import { listAccounts, listJournals } from "../../store";
import type { AccountType, JournalEntry, LedgerAccount } from "../../types";
import { recordMatchesFilters } from "../dimensions";

export type AccountBalance = {
  readonly account: LedgerAccount;
  readonly debit: number;
  readonly credit: number;
  readonly balance: number;
  readonly sourceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
};

function signedBalance(type: AccountType, debit: number, credit: number): number {
  switch (type) {
    case "asset":
    case "expense":
    case "contra_liability":
    case "contra_equity":
      return debit - credit;
    case "liability":
    case "equity":
    case "revenue":
    case "contra_asset":
      return credit - debit;
    default:
      return debit - credit;
  }
}

function journalInScope(
  j: JournalEntry,
  opts: {
    periodKey?: string | null;
    entityId?: string | null;
    consolidated?: boolean;
    dimensionFilters?: Readonly<Record<string, string>>;
  }
): boolean {
  if (j.status !== "posted") return false;
  if (opts.periodKey && j.periodKey !== opts.periodKey) return false;
  if (!opts.consolidated && opts.entityId && j.entityId !== opts.entityId) {
    return false;
  }
  if (
    opts.dimensionFilters &&
    !recordMatchesFilters(
      j.organizationId,
      "journal",
      j.id,
      opts.dimensionFilters
    )
  ) {
    return false;
  }
  return true;
}

export function computeAccountBalances(input: {
  organizationId: string;
  periodKey?: string | null;
  entityId?: string | null;
  consolidated?: boolean;
  dimensionFilters?: Readonly<Record<string, string>>;
  accountTypes?: readonly AccountType[];
}): AccountBalance[] {
  const accounts = listAccounts(input.organizationId).filter((a) => a.active);
  const journals = listJournals(input.organizationId).filter((j) =>
    journalInScope(j, input)
  );
  const typeFilter = input.accountTypes
    ? new Set(input.accountTypes)
    : null;

  const map = new Map<
    string,
    {
      account: LedgerAccount;
      debit: number;
      credit: number;
      refs: { recordType: string; recordId: string }[];
    }
  >();

  for (const a of accounts) {
    if (typeFilter && !typeFilter.has(a.type)) continue;
    if (
      !input.consolidated &&
      input.entityId &&
      a.entityId &&
      a.entityId !== input.entityId
    ) {
      continue;
    }
    map.set(a.id, { account: a, debit: 0, credit: 0, refs: [] });
  }

  for (const j of journals) {
    for (const line of j.lines) {
      const row = map.get(line.accountId);
      if (!row) continue;
      row.debit += line.debit;
      row.credit += line.credit;
      row.refs.push({ recordType: "journal", recordId: j.id });
    }
  }

  return [...map.values()].map((r) =>
    Object.freeze({
      account: r.account,
      debit: r.debit,
      credit: r.credit,
      balance: signedBalance(r.account.type, r.debit, r.credit),
      sourceRefs: Object.freeze(r.refs),
    })
  );
}
