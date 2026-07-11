/**
 * Accounting Intelligence — Posting Engine.
 *
 * Draft journals, balanced validation, post/reverse, recurring, scheduled,
 * batch posting, period validation, duplicate prevention, immutable history.
 *
 * Composes FinanceGeneralLedger for authoritative double-entry posting.
 * Does NOT duplicate GL business logic.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingControls } from "@/lib/platform/accounting/controls";
import type { AccountingGaap } from "@/lib/platform/accounting/gaap";
import type { AccountingPeriods } from "@/lib/platform/accounting/periods";
import type {
  AccountingDimensionalContext,
  AccountingJournal,
  AccountingJournalLine,
  AccountingJournalType,
  AccountingMetadata,
  AccountingRecurringJournal,
  AccountingScheduledPosting,
} from "@/lib/platform/accounting/types";
import type { FinanceGeneralLedger } from "@/lib/platform/finance/ledger";
import { emptyDimensions } from "@/lib/platform/finance/types";

export interface AccountingPostingDependencies {
  gl: FinanceGeneralLedger;
  periods: AccountingPeriods;
  gaap: AccountingGaap;
  controls: AccountingControls;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export interface DraftJournalInput {
  journalType: AccountingJournalType;
  periodId: string;
  memo: string;
  currency?: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    memo?: string;
    dimensions?: AccountingDimensionalContext;
  }>;
  dimensions?: AccountingDimensionalContext;
  reason?: string | null;
  evidenceRef?: string | null;
  approvalRef?: string | null;
  sourceTransactionId?: string | null;
  workflowRef?: string | null;
  recommendationRef?: string | null;
  governanceDecisionRef?: string | null;
  createdBy?: string | null;
  metadata?: AccountingMetadata;
}

export interface PostJournalOptions {
  actorId?: string | null;
  allowHardCloseAdjustment?: boolean;
  skipDuplicateCheck?: boolean;
}

function fingerprintLines(
  lines: readonly { accountId: string; debit: number; credit: number }[],
  periodId: string,
  journalType: AccountingJournalType,
  memo: string
): string {
  const normalized = lines
    .map((l) => `${l.accountId}:${l.debit}:${l.credit}`)
    .sort()
    .join("|");
  return `${journalType}|${periodId}|${memo}|${normalized}`;
}

export class AccountingPosting {
  private readonly journals = new Map<string, AccountingJournal>();
  private readonly fingerprints = new Map<string, string>();
  private readonly recurring = new Map<string, AccountingRecurringJournal>();
  private readonly scheduled = new Map<string, AccountingScheduledPosting>();
  private readonly postingHistory: AccountingJournal[] = [];
  private readonly gl: FinanceGeneralLedger;
  private readonly periods: AccountingPeriods;
  private readonly gaap: AccountingGaap;
  private readonly controls: AccountingControls;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private journalSequence = 0;

  constructor(deps: AccountingPostingDependencies) {
    this.gl = deps.gl;
    this.periods = deps.periods;
    this.gaap = deps.gaap;
    this.controls = deps.controls;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  /** Create a draft journal with balanced-line validation. */
  draftJournal(input: DraftJournalInput): AccountingJournal {
    this.controls.assertCanDraft(input.createdBy);

    const lineInputs = input.lines.map((l) => ({
      debit: l.debit,
      credit: l.credit,
    }));
    const balanced = this.gaap.validateBalancedLines(lineInputs);
    if (!balanced.valid) {
      throw new Error(balanced.errors.join("; "));
    }

    const dimensions = input.dimensions ?? emptyDimensions();
    const dimsCheck = this.gaap.validateDimensions(dimensions);
    if (!dimsCheck.valid) {
      throw new Error(dimsCheck.errors.join("; "));
    }

    if (!this.periods.getPeriod(input.periodId)) {
      throw new Error(`Period not found: ${input.periodId}`);
    }

    this.journalSequence += 1;
    const id = this.createId("aj");
    const journalNumber = `AJ-${String(this.journalSequence).padStart(6, "0")}`;
    const lines: AccountingJournalLine[] = input.lines.map((l, i) => ({
      id: this.createId("ajl"),
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      dimensions: l.dimensions ?? dimensions,
      memo: l.memo ?? `${input.memo} (line ${i + 1})`,
    }));

    const fp = fingerprintLines(
      lines,
      input.periodId,
      input.journalType,
      input.memo
    );

    const journal: AccountingJournal = {
      id,
      journalNumber,
      journalType: input.journalType,
      status: "draft",
      periodId: input.periodId,
      memo: input.memo,
      currency: input.currency ?? "USD",
      lines,
      dimensions,
      reason: input.reason ?? null,
      evidenceRef: input.evidenceRef ?? null,
      approvalRef: input.approvalRef ?? null,
      sourceTransactionId: input.sourceTransactionId ?? null,
      workflowRef: input.workflowRef ?? null,
      recommendationRef: input.recommendationRef ?? null,
      governanceDecisionRef: input.governanceDecisionRef ?? null,
      financeJournalId: null,
      reversedById: null,
      reversesId: null,
      fingerprint: fp,
      createdBy: input.createdBy ?? null,
      postedBy: null,
      createdAt: this.now().toISOString(),
      postedAt: null,
      metadata: input.metadata,
    };

    this.journals.set(id, journal);
    this.audit.record({
      kind: "journal",
      entityId: id,
      entityType: "AccountingJournal",
      action: "draft",
      actorId: input.createdBy,
      reason: input.reason,
      evidenceRef: input.evidenceRef,
      approvalRef: input.approvalRef,
      sourceTransactionId: input.sourceTransactionId,
      workflowRef: input.workflowRef,
      recommendationRef: input.recommendationRef,
      governanceDecisionRef: input.governanceDecisionRef,
      dimensions,
      details: { journalNumber, journalType: input.journalType },
    });

    return journal;
  }

  /**
   * Post a draft journal into the Finance GL.
   * Enforces period locks, GAAP, duplicate prevention, and posting permissions.
   */
  postJournal(
    journalId: string,
    options?: PostJournalOptions
  ): AccountingJournal {
    const journal = this.require(journalId);
    this.controls.assertCanPost(options?.actorId);

    if (journal.status !== "draft" && journal.status !== "approved") {
      throw new Error(
        `Journal ${journalId} cannot be posted from status ${journal.status}`
      );
    }

    const period = this.periods.getPeriod(journal.periodId);
    const validation = this.gaap.validateJournalForPost(journal, period, {
      allowHardCloseAdjustment: options?.allowHardCloseAdjustment,
    });
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    if (!options?.skipDuplicateCheck) {
      const existing = this.fingerprints.get(journal.fingerprint);
      if (existing && existing !== journalId) {
        throw new Error(
          `Duplicate journal detected (matches posted journal ${existing})`
        );
      }
    }

    // Compose Finance GL — authoritative double-entry posting
    const financeEntry = this.gl.postJournal({
      memo: journal.memo,
      currency: journal.currency,
      dimensions: journal.dimensions,
      postings: journal.lines.map((l) => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        memo: l.memo,
        dimensions: l.dimensions,
      })),
      metadata: journal.metadata,
    });

    const posted: AccountingJournal = {
      ...journal,
      status: "posted",
      financeJournalId: financeEntry.id,
      postedBy: options?.actorId ?? null,
      postedAt: this.now().toISOString(),
    };

    this.journals.set(journalId, posted);
    this.fingerprints.set(journal.fingerprint, journalId);
    this.postingHistory.push(posted);

    this.audit.record({
      kind: "posting",
      entityId: journalId,
      entityType: "AccountingJournal",
      action: "post",
      actorId: options?.actorId,
      reason: journal.reason,
      evidenceRef: journal.evidenceRef,
      approvalRef: journal.approvalRef,
      sourceTransactionId: journal.sourceTransactionId,
      workflowRef: journal.workflowRef,
      recommendationRef: journal.recommendationRef,
      governanceDecisionRef: journal.governanceDecisionRef,
      dimensions: journal.dimensions,
      details: {
        financeJournalId: financeEntry.id,
        journalNumber: journal.journalNumber,
      },
    });

    return posted;
  }

  /**
   * Reverse a posted journal via Finance GL reversal + accounting mirror.
   * Original is never deleted.
   */
  reverseJournal(
    journalId: string,
    memo: string,
    options?: PostJournalOptions
  ): AccountingJournal {
    const original = this.require(journalId);
    this.controls.assertCanReverse(options?.actorId);

    if (original.status !== "posted") {
      throw new Error(`Only posted journals can be reversed (got ${original.status})`);
    }
    if (!original.financeJournalId) {
      throw new Error(`Journal ${journalId} has no Finance GL reference`);
    }

    const period = this.periods.getPeriod(original.periodId);
    const periodCheck = this.gaap.validatePeriodForPosting(period, {
      allowHardCloseAdjustment: options?.allowHardCloseAdjustment,
    });
    if (!periodCheck.valid) {
      throw new Error(periodCheck.errors.join("; "));
    }

    const financeReversal = this.gl.reverseJournal(
      original.financeJournalId,
      memo,
      original.dimensions
    );

    this.journalSequence += 1;
    const reversalId = this.createId("aj");
    const reversalLines: AccountingJournalLine[] = original.lines.map((l) => ({
      id: this.createId("ajl"),
      accountId: l.accountId,
      debit: l.credit,
      credit: l.debit,
      dimensions: l.dimensions,
      memo: `Reversal: ${l.memo}`,
    }));

    const reversal: AccountingJournal = {
      id: reversalId,
      journalNumber: `AJ-${String(this.journalSequence).padStart(6, "0")}-REV`,
      journalType: original.journalType,
      status: "posted",
      periodId: original.periodId,
      memo,
      currency: original.currency,
      lines: reversalLines,
      dimensions: original.dimensions,
      reason: memo,
      evidenceRef: original.evidenceRef,
      approvalRef: original.approvalRef,
      sourceTransactionId: original.sourceTransactionId,
      workflowRef: original.workflowRef,
      recommendationRef: original.recommendationRef,
      governanceDecisionRef: original.governanceDecisionRef,
      financeJournalId: financeReversal.id,
      reversedById: null,
      reversesId: journalId,
      fingerprint: fingerprintLines(
        reversalLines,
        original.periodId,
        original.journalType,
        memo
      ),
      createdBy: options?.actorId ?? null,
      postedBy: options?.actorId ?? null,
      createdAt: this.now().toISOString(),
      postedAt: this.now().toISOString(),
    };

    const marked: AccountingJournal = {
      ...original,
      status: "reversed",
      reversedById: reversalId,
    };

    this.journals.set(journalId, marked);
    this.journals.set(reversalId, reversal);
    this.postingHistory.push(reversal);

    this.audit.record({
      kind: "reversal",
      entityId: journalId,
      entityType: "AccountingJournal",
      action: "reverse",
      actorId: options?.actorId,
      reason: memo,
      dimensions: original.dimensions,
      details: {
        reversalId,
        financeReversalId: financeReversal.id,
      },
    });

    return reversal;
  }

  /** Approve a draft journal (status → approved). */
  approveJournal(
    journalId: string,
    approvalRef: string,
    approverId: string
  ): AccountingJournal {
    const journal = this.require(journalId);
    if (journal.status !== "draft" && journal.status !== "pending_approval") {
      throw new Error(`Cannot approve journal in status ${journal.status}`);
    }
    this.controls.assertSeparationOfDuties({
      approverId,
      preparerId: journal.createdBy,
      posterId: journal.postedBy,
    });

    const updated: AccountingJournal = {
      ...journal,
      status: "approved",
      approvalRef,
    };
    this.journals.set(journalId, updated);

    this.audit.record({
      kind: "approval",
      entityId: journalId,
      entityType: "AccountingJournal",
      action: "approve",
      actorId: approverId,
      approvalRef,
      dimensions: journal.dimensions,
    });

    return updated;
  }

  createRecurring(input: {
    name: string;
    journalType: AccountingJournalType;
    memo: string;
    currency?: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo?: string;
      dimensions?: AccountingDimensionalContext;
    }>;
    dimensions: AccountingDimensionalContext;
    intervalDays: number;
    nextPostDate: string;
    metadata?: AccountingMetadata;
  }): AccountingRecurringJournal {
    const balanced = this.gaap.validateBalancedLines(input.lines);
    if (!balanced.valid) {
      throw new Error(balanced.errors.join("; "));
    }

    const recurring: AccountingRecurringJournal = {
      id: this.createId("rec"),
      name: input.name,
      journalType: input.journalType,
      template: {
        memo: input.memo,
        currency: input.currency ?? "USD",
        lines: input.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          dimensions: l.dimensions ?? input.dimensions,
          memo: l.memo ?? input.memo,
        })),
        dimensions: input.dimensions,
      },
      intervalDays: input.intervalDays,
      nextPostDate: input.nextPostDate,
      lastPostedAt: null,
      active: true,
      createdAt: this.now().toISOString(),
      metadata: input.metadata,
    };
    this.recurring.set(recurring.id, recurring);
    return recurring;
  }

  /** Post due recurring journals into a period. */
  postRecurringDue(
    periodId: string,
    asOfDate: string,
    options?: PostJournalOptions
  ): AccountingJournal[] {
    const posted: AccountingJournal[] = [];
    for (const rec of this.recurring.values()) {
      if (!rec.active) continue;
      if (rec.nextPostDate > asOfDate) continue;

      const draft = this.draftJournal({
        journalType: rec.journalType,
        periodId,
        memo: rec.template.memo,
        currency: rec.template.currency,
        lines: rec.template.lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          memo: l.memo,
          dimensions: l.dimensions,
        })),
        dimensions: rec.template.dimensions,
        createdBy: options?.actorId,
      });
      const result = this.postJournal(draft.id, {
        ...options,
        skipDuplicateCheck: true,
      });
      posted.push(result);

      const next = new Date(rec.nextPostDate);
      next.setUTCDate(next.getUTCDate() + rec.intervalDays);
      this.recurring.set(rec.id, {
        ...rec,
        lastPostedAt: this.now().toISOString(),
        nextPostDate: next.toISOString().slice(0, 10),
      });
    }
    return posted;
  }

  schedulePosting(
    journalId: string,
    scheduledFor: string
  ): AccountingScheduledPosting {
    this.require(journalId);
    const scheduled: AccountingScheduledPosting = {
      id: this.createId("sched"),
      journalId,
      scheduledFor,
      status: "pending",
      postedAt: null,
      error: null,
      createdAt: this.now().toISOString(),
    };
    this.scheduled.set(scheduled.id, scheduled);
    return scheduled;
  }

  /** Execute pending scheduled postings due on or before asOfDate. */
  runScheduled(
    asOfDate: string,
    options?: PostJournalOptions
  ): AccountingScheduledPosting[] {
    const results: AccountingScheduledPosting[] = [];
    for (const item of this.scheduled.values()) {
      if (item.status !== "pending") continue;
      if (item.scheduledFor > asOfDate) continue;

      try {
        this.postJournal(item.journalId, options);
        const updated: AccountingScheduledPosting = {
          ...item,
          status: "posted",
          postedAt: this.now().toISOString(),
          error: null,
        };
        this.scheduled.set(item.id, updated);
        results.push(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const failed: AccountingScheduledPosting = {
          ...item,
          status: "failed",
          error: message,
        };
        this.scheduled.set(item.id, failed);
        results.push(failed);
      }
    }
    return results;
  }

  /** Batch post multiple draft/approved journals. */
  batchPost(
    journalIds: readonly string[],
    options?: PostJournalOptions
  ): AccountingJournal[] {
    return journalIds.map((id) => this.postJournal(id, options));
  }

  getJournal(id: string): AccountingJournal | undefined {
    return this.journals.get(id);
  }

  listJournals(filter?: {
    status?: AccountingJournal["status"];
    periodId?: string;
    journalType?: AccountingJournalType;
  }): AccountingJournal[] {
    let list = [...this.journals.values()];
    if (filter?.status) {
      list = list.filter((j) => j.status === filter.status);
    }
    if (filter?.periodId) {
      list = list.filter((j) => j.periodId === filter.periodId);
    }
    if (filter?.journalType) {
      list = list.filter((j) => j.journalType === filter.journalType);
    }
    return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  listUnposted(periodId?: string): AccountingJournal[] {
    return this.listJournals({
      status: "draft",
      periodId,
    }).concat(
      this.listJournals({ status: "approved", periodId }),
      this.listJournals({ status: "pending_approval", periodId })
    );
  }

  /** Immutable posting history snapshot (never mutated in place). */
  getPostingHistory(): readonly AccountingJournal[] {
    return [...this.postingHistory];
  }

  listRecurring(): AccountingRecurringJournal[] {
    return [...this.recurring.values()];
  }

  listScheduled(): AccountingScheduledPosting[] {
    return [...this.scheduled.values()];
  }

  private require(journalId: string): AccountingJournal {
    const journal = this.journals.get(journalId);
    if (!journal) {
      throw new Error(`Accounting journal not found: ${journalId}`);
    }
    return journal;
  }
}

export function createAccountingPosting(
  deps: AccountingPostingDependencies
): AccountingPosting {
  return new AccountingPosting(deps);
}
