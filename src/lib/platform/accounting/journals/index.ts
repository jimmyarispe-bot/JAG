/**
 * Accounting Intelligence — Journal Type Registry & Helpers.
 *
 * Thin façade over the posting engine for typed journal creation
 * by journal category (general, payroll, cash, grant, etc.).
 */

import type { AccountingPosting, DraftJournalInput } from "@/lib/platform/accounting/posting";
import type {
  AccountingJournal,
  AccountingJournalType,
} from "@/lib/platform/accounting/types";

export interface AccountingJournalsDependencies {
  posting: AccountingPosting;
}

const SUPPORTED_TYPES: readonly AccountingJournalType[] = [
  "general",
  "payroll",
  "cash",
  "grant",
  "scholarship",
  "depreciation",
  "allocation",
  "reclassification",
  "adjustment",
  "closing",
  "opening",
  "intercompany",
] as const;

export class AccountingJournals {
  private readonly posting: AccountingPosting;

  constructor(deps: AccountingJournalsDependencies) {
    this.posting = deps.posting;
  }

  listTypes(): readonly AccountingJournalType[] {
    return SUPPORTED_TYPES;
  }

  isSupported(type: string): type is AccountingJournalType {
    return (SUPPORTED_TYPES as readonly string[]).includes(type);
  }

  draft(
    journalType: AccountingJournalType,
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    if (!this.isSupported(journalType)) {
      throw new Error(`Unsupported journal type: ${journalType}`);
    }
    return this.posting.draftJournal({ ...input, journalType });
  }

  draftGeneral(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("general", input);
  }

  draftPayroll(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("payroll", input);
  }

  draftCash(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("cash", input);
  }

  draftGrant(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("grant", input);
  }

  draftScholarship(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    return this.draft("scholarship", input);
  }

  draftDepreciation(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    return this.draft("depreciation", input);
  }

  draftAllocation(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    return this.draft("allocation", input);
  }

  draftReclassification(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    if (!input.reason) {
      throw new Error("Reason is required for reclassification journals");
    }
    return this.draft("reclassification", input);
  }

  draftAdjustment(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    return this.draft("adjustment", input);
  }

  draftClosing(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("closing", input);
  }

  draftOpening(input: Omit<DraftJournalInput, "journalType">): AccountingJournal {
    return this.draft("opening", input);
  }

  draftIntercompany(
    input: Omit<DraftJournalInput, "journalType">
  ): AccountingJournal {
    return this.draft("intercompany", input);
  }
}

export function createAccountingJournals(
  deps: AccountingJournalsDependencies
): AccountingJournals {
  return new AccountingJournals(deps);
}
