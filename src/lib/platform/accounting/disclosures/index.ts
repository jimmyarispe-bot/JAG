/**
 * Accounting Intelligence — Financial Statement Disclosures.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type {
  AccountingDisclosure,
  AccountingMetadata,
  AccountingStatementKind,
} from "@/lib/platform/accounting/types";

export interface AccountingDisclosuresDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class AccountingDisclosures {
  private readonly items = new Map<string, AccountingDisclosure>();
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps?: AccountingDisclosuresDependencies) {
    this.createId = deps?.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps?.now ?? (() => new Date());
  }

  add(input: {
    title: string;
    body: string;
    periodId: string;
    statementKind?: AccountingStatementKind | null;
    required?: boolean;
    metadata?: AccountingMetadata;
  }): AccountingDisclosure {
    const disclosure: AccountingDisclosure = {
      id: this.createId("disc"),
      title: input.title,
      body: input.body,
      statementKind: input.statementKind ?? null,
      periodId: input.periodId,
      required: input.required ?? false,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.items.set(disclosure.id, disclosure);
    return disclosure;
  }

  get(id: string): AccountingDisclosure | undefined {
    return this.items.get(id);
  }

  list(periodId?: string): AccountingDisclosure[] {
    const all = [...this.items.values()];
    return periodId ? all.filter((d) => d.periodId === periodId) : all;
  }

  listRequired(periodId: string): AccountingDisclosure[] {
    return this.list(periodId).filter((d) => d.required);
  }
}

export function createAccountingDisclosures(
  deps?: AccountingDisclosuresDependencies
): AccountingDisclosures {
  return new AccountingDisclosures(deps);
}
