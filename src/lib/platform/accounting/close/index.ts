/**
 * Accounting Intelligence — Period Close Process.
 *
 * Month / quarter / year-end close with checklist, outstanding items,
 * missing reconciliations, unposted journals, approval + board signoff.
 */

import { createAccountingId } from "@/lib/platform/accounting/ids";
import type { AccountingAudit } from "@/lib/platform/accounting/audit";
import type { AccountingControls } from "@/lib/platform/accounting/controls";
import type { AccountingPeriods } from "@/lib/platform/accounting/periods";
import type { AccountingPosting } from "@/lib/platform/accounting/posting";
import type { AccountingReconciliationService } from "@/lib/platform/accounting/reconciliation";
import type {
  AccountingCloseChecklistItem,
  AccountingCloseKind,
  AccountingCloseProcess,
  AccountingMetadata,
} from "@/lib/platform/accounting/types";

export interface AccountingCloseDependencies {
  periods: AccountingPeriods;
  posting: AccountingPosting;
  reconciliation: AccountingReconciliationService;
  controls: AccountingControls;
  audit: AccountingAudit;
  createId?: (prefix: string) => string;
  now?: () => Date;
}

const DEFAULT_CHECKLIST: Array<{ label: string; required: boolean }> = [
  { label: "All journals posted or voided", required: true },
  { label: "Bank reconciliations complete", required: true },
  { label: "Accruals recorded", required: true },
  { label: "Deferrals recognized", required: false },
  { label: "Intercompany eliminations reviewed", required: false },
  { label: "Financial statements generated", required: true },
  { label: "Controller approval", required: true },
  { label: "Board signoff (year-end)", required: false },
];

export class AccountingClose {
  private readonly processes = new Map<string, AccountingCloseProcess>();
  private readonly periods: AccountingPeriods;
  private readonly posting: AccountingPosting;
  private readonly reconciliation: AccountingReconciliationService;
  private readonly controls: AccountingControls;
  private readonly audit: AccountingAudit;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;

  constructor(deps: AccountingCloseDependencies) {
    this.periods = deps.periods;
    this.posting = deps.posting;
    this.reconciliation = deps.reconciliation;
    this.controls = deps.controls;
    this.audit = deps.audit;
    this.createId = deps.createId ?? ((prefix) => createAccountingId(prefix));
    this.now = deps.now ?? (() => new Date());
  }

  start(input: {
    kind: AccountingCloseKind;
    periodId: string;
    actorId?: string | null;
    metadata?: AccountingMetadata;
  }): AccountingCloseProcess {
    this.controls.assertCanClose(input.actorId);

    if (!this.periods.getPeriod(input.periodId)) {
      throw new Error(`Period not found: ${input.periodId}`);
    }

    const unposted = this.posting.listUnposted(input.periodId);
    const missingRecons = this.reconciliation
      .list({ periodId: input.periodId })
      .filter((r) => r.status !== "reconciled")
      .map((r) => r.id);

    const checklist: AccountingCloseChecklistItem[] = DEFAULT_CHECKLIST.map(
      (item) => ({
        id: this.createId("chk"),
        label: item.label,
        completed: false,
        completedAt: null,
        completedBy: null,
        required:
          item.required ||
          (input.kind === "year_end" && item.label.includes("Board")),
      })
    );

    const outstanding: string[] = [];
    if (unposted.length > 0) {
      outstanding.push(`${unposted.length} unposted journal(s)`);
    }
    if (missingRecons.length > 0) {
      outstanding.push(`${missingRecons.length} missing reconciliation(s)`);
    }

    const process: AccountingCloseProcess = {
      id: this.createId("close"),
      kind: input.kind,
      periodId: input.periodId,
      status: outstanding.length > 0 ? "blocked" : "in_progress",
      checklist,
      outstandingItems: outstanding,
      missingReconciliations: missingRecons,
      unpostedJournalIds: unposted.map((j) => j.id),
      approvalRef: null,
      boardSignoffRef: null,
      startedAt: this.now().toISOString(),
      completedAt: null,
      metadata: input.metadata,
    };
    this.processes.set(process.id, process);

    this.audit.record({
      kind: "close",
      entityId: process.id,
      entityType: "AccountingCloseProcess",
      action: "start",
      actorId: input.actorId,
      details: { kind: input.kind, periodId: input.periodId, status: process.status },
    });

    return process;
  }

  completeChecklistItem(
    processId: string,
    itemId: string,
    actorId?: string | null
  ): AccountingCloseProcess {
    const process = this.require(processId);
    const checklist = process.checklist.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed: true,
            completedAt: this.now().toISOString(),
            completedBy: actorId ?? null,
          }
        : item
    );
    const updated: AccountingCloseProcess = { ...process, checklist };
    this.processes.set(processId, updated);
    return updated;
  }

  submitForApproval(
    processId: string,
    approvalRef: string,
    actorId?: string | null
  ): AccountingCloseProcess {
    const process = this.require(processId);
    this.assertReady(process);
    const updated: AccountingCloseProcess = {
      ...process,
      status: "pending_approval",
      approvalRef,
    };
    this.processes.set(processId, updated);
    this.audit.record({
      kind: "close",
      entityId: processId,
      entityType: "AccountingCloseProcess",
      action: "submit_approval",
      actorId,
      approvalRef,
    });
    return updated;
  }

  requestBoardSignoff(
    processId: string,
    boardSignoffRef: string,
    actorId?: string | null
  ): AccountingCloseProcess {
    const process = this.require(processId);
    if (process.kind !== "year_end") {
      throw new Error("Board signoff is only supported for year-end close");
    }
    const updated: AccountingCloseProcess = {
      ...process,
      status: "pending_board_signoff",
      boardSignoffRef,
    };
    this.processes.set(processId, updated);
    this.audit.record({
      kind: "close",
      entityId: processId,
      entityType: "AccountingCloseProcess",
      action: "request_board_signoff",
      actorId,
      details: { boardSignoffRef },
    });
    return updated;
  }

  /**
   * Complete close: soft/hard close the period based on kind.
   */
  complete(processId: string, actorId?: string | null): AccountingCloseProcess {
    this.controls.assertCanClose(actorId);
    const process = this.require(processId);
    this.assertReady(process);

    const requiredIncomplete = process.checklist.filter(
      (c) => c.required && !c.completed
    );
    if (requiredIncomplete.length > 0) {
      throw new Error(
        `Required checklist items incomplete: ${requiredIncomplete.map((c) => c.label).join(", ")}`
      );
    }

    if (process.kind === "year_end") {
      if (!process.boardSignoffRef) {
        throw new Error("Year-end close requires board signoff");
      }
      this.periods.hardClose(process.periodId, actorId ?? undefined);
      this.periods.markYearEnd(process.periodId, actorId ?? undefined);
    } else if (process.kind === "quarter") {
      this.periods.hardClose(process.periodId, actorId ?? undefined);
    } else {
      this.periods.softClose(process.periodId, actorId ?? undefined);
    }

    const updated: AccountingCloseProcess = {
      ...process,
      status: "completed",
      completedAt: this.now().toISOString(),
      outstandingItems: [],
    };
    this.processes.set(processId, updated);

    this.audit.record({
      kind: "close",
      entityId: processId,
      entityType: "AccountingCloseProcess",
      action: "complete",
      actorId,
      approvalRef: process.approvalRef,
      details: { kind: process.kind, periodId: process.periodId },
    });

    return updated;
  }

  /** Refresh outstanding / unposted / missing recons. */
  refresh(processId: string): AccountingCloseProcess {
    const process = this.require(processId);
    const unposted = this.posting.listUnposted(process.periodId);
    const missingRecons = this.reconciliation
      .list({ periodId: process.periodId })
      .filter((r) => r.status !== "reconciled")
      .map((r) => r.id);

    const outstanding: string[] = [];
    if (unposted.length > 0) {
      outstanding.push(`${unposted.length} unposted journal(s)`);
    }
    if (missingRecons.length > 0) {
      outstanding.push(`${missingRecons.length} missing reconciliation(s)`);
    }

    const updated: AccountingCloseProcess = {
      ...process,
      unpostedJournalIds: unposted.map((j) => j.id),
      missingReconciliations: missingRecons,
      outstandingItems: outstanding,
      status:
        process.status === "completed"
          ? process.status
          : outstanding.length > 0
            ? "blocked"
            : process.status === "blocked"
              ? "in_progress"
              : process.status,
    };
    this.processes.set(processId, updated);
    return updated;
  }

  get(id: string): AccountingCloseProcess | undefined {
    return this.processes.get(id);
  }

  list(periodId?: string): AccountingCloseProcess[] {
    const all = [...this.processes.values()];
    return periodId ? all.filter((p) => p.periodId === periodId) : all;
  }

  private assertReady(process: AccountingCloseProcess): void {
    if (process.unpostedJournalIds.length > 0) {
      throw new Error("Cannot proceed: unposted journals remain");
    }
    if (process.missingReconciliations.length > 0) {
      throw new Error("Cannot proceed: missing reconciliations remain");
    }
  }

  private require(id: string): AccountingCloseProcess {
    const p = this.processes.get(id);
    if (!p) throw new Error(`Close process not found: ${id}`);
    return p;
  }
}

export function createAccountingClose(
  deps: AccountingCloseDependencies
): AccountingClose {
  return new AccountingClose(deps);
}
