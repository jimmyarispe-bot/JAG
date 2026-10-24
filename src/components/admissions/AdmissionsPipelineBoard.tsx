"use client";

/**
 * CURRENT ADMISSIONS PIPELINE - THE BOARD.
 *
 * Rebuilt 18 October 2026. Jimmy: "the document is the one with the correct
 * stages. plus move to quiet at the bottom", and "just want the search bar
 * and stages. and when user clicks on a students card they see all of their
 * inquiry/application information".
 *
 * COLUMNS ARE THE ADMISSIONS FLOW DOCUMENT'S SIX STAGES, then Enrolled. The
 * database keeps its finer stages; BOARD_GROUPS (lib/constants/admissions)
 * says which of them each column holds. A child on a stage no column holds -
 * the Quiet Students stages - is not on this board; that page shows them.
 *
 * COLUMN 6, ADMISSIONS DECISION, carries the open accept-or-deny questions,
 * answered on the card as before. Then two LOCKED columns: Finalizing Contract
 * (accepted) and Enrolled. Their cards have no dropdown - Jimmy moves them
 * from the Finalizing Contract page and nowhere else.
 *
 * THE WHOLE CARD OPENS THE CHILD'S FULL RECORD - the inquiry and the
 * application on one page, no tabs (cases/[id]/full). The dropdown on the card
 * does not open it.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useActionFeedback } from "@/components/experience-system/feedback";
import { updateCaseStage } from "@/lib/admissions/case/actions";
import { scheduleAppointmentAndAdvance } from "@/lib/admissions/actions";
import {
  stageRequiresAppointment,
  type AppointmentStage,
} from "@/lib/admissions/appointment-stages";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { PipelineFilters } from "./PipelineFilters";
import { BoardScroller } from "./BoardScroller";
import {
  applyFilters,
  filtersFromParams,
  type BoardFilters,
  type BoardLead,
} from "@/lib/admissions/board-filters";
import {
  BOARD_GROUPS,
  MOVE_TO_QUIET_STAGE,
  boardGroupChoiceLabel,
  choosableBoardGroupsFor,
  boardGroupForStage,
  boardGroupLabel,
  leadStageLabel,
  type BoardGroup,
  type LeadStageValue,
} from "@/lib/constants/admissions";
import { programLabel } from "@/lib/constants/programs";
import {
  daysInCurrentStage,
  pipelineAgingClasses,
  pipelineAgingDotClass,
} from "@/lib/admissions/workflow";
import type { AdmissionLead } from "@/lib/admissions/queries";
import type { PendingGate } from "@/lib/admissions/gates/definitions";
import { BoardDecisionColumn } from "./BoardDecisionColumn";

const QUIET_OPTION = "__move_to_quiet__";

export function fullRecordHref(leadId: string): string {
  return `/dashboard/admissions/cases/${leadId}/full`;
}

interface AdmissionsPipelineBoardProps {
  leads: AdmissionLead[];
  /**
   * Open accept-or-deny gates. Absent means the read failed or was not made,
   * and column 6 is drawn without them rather than claiming none are waiting.
   */
  decisionGates?: readonly PendingGate[];
}

export function AdmissionsPipelineBoard({ leads, decisionGates }: AdmissionsPipelineBoardProps) {
  const router = useRouter();
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Update stage", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Stage updated.",
    errorToast: "Unable to update stage.",
    progressLabel: "Updating case stage…",
  });

  const [filters, setFilters] = useState<BoardFilters>(() =>
    filtersFromParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search)
    )
  );

  const allLeads = leads as readonly BoardLead[];
  const visibleLeads = useMemo(() => applyFilters(allLeads, filters), [allLeads, filters]);

  const awaitingDecision = useMemo(
    () => new Set((decisionGates ?? []).map((gate) => gate.leadId)),
    [decisionGates]
  );

  const columns = useMemo(() => {
    const byGroup = BOARD_GROUPS.map((group) => ({
      group,
      groupLeads: visibleLeads.filter(
        (lead) =>
          boardGroupForStage(lead.lead_stage)?.key === group.key && !awaitingDecision.has(lead.id)
      ),
    }));
    return filters.q.trim()
      ? byGroup.filter((c) => c.groupLeads.length > 0 || (c.group.key === "decision" && awaitingDecision.size > 0))
      : byGroup;
  }, [visibleLeads, filters.q, awaitingDecision]);

  const visibleDecisionGates = useMemo(() => {
    if (!decisionGates) return null;
    const shown = new Set(visibleLeads.map((lead) => lead.id));
    return decisionGates.filter((gate) => shown.has(gate.leadId));
  }, [decisionGates, visibleLeads]);

  const [pending, setPending] = useState<{
    leadId: string;
    stage: AppointmentStage;
    studentName: string;
  } | null>(null);

  function moveTo(leadId: string, stage: LeadStageValue, studentName: string) {
    if (stageRequiresAppointment(stage)) {
      setPending({ leadId, stage, studentName });
      return;
    }
    void action.run(async () => {
      const result = await updateCaseStage(leadId, stage);
      // A returned { error } is not a rejection; without this the board shows
      // "✓ Updated" over a stage that has not moved.
      if (result && "error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return { success: true };
    });
  }

  function handleChoice(lead: BoardLead, choice: string) {
    const studentName = `${lead.first_name} ${lead.last_name}`;
    if (choice === QUIET_OPTION) {
      moveTo(lead.id, MOVE_TO_QUIET_STAGE, studentName);
      return;
    }
    const group = choosableBoardGroupsFor(lead.school_id).find((g) => g.key === choice);
    if (!group) return;
    if (boardGroupForStage(lead.lead_stage)?.key === group.key) return;
    moveTo(lead.id, group.entry, studentName);
  }

  function confirmAppointment(input: {
    scheduledAt: string;
    appointmentType: string;
    notes: string;
  }) {
    if (!pending) return;
    const { leadId, stage } = pending;
    void action.run(async () => {
      const result = await scheduleAppointmentAndAdvance({
        leadId,
        leadStage: stage,
        scheduledAt: input.scheduledAt,
        appointmentType: input.appointmentType,
        notes: input.notes,
      });
      if (result && "error" in result && result.error) throw new Error(result.error);
      setPending(null);
      router.refresh();
      return { success: true };
    });
  }

  function renderCard(lead: BoardLead) {
    const days = daysInCurrentStage(lead.stage_entered_at);
    const href = fullRecordHref(lead.id);
    const open = () => router.push(href);
    const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();
    const current = boardGroupForStage(lead.lead_stage);
    return (
      <div
        key={lead.id}
        role="link"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter") open();
        }}
        className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-brand-300 hover:shadow"
      >
        <div className="flex items-start justify-between gap-2">
          <Link href={href} onClick={stop} className="font-medium text-slate-900 hover:text-brand-600">
            {lead.first_name} {lead.last_name}
          </Link>
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${pipelineAgingDotClass(days)}`}
            title={`${days} days in stage`}
          />
        </div>
        <span
          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${pipelineAgingClasses(days)}`}
        >
          {days}d
        </span>
        <p className="mt-1 text-xs text-slate-500">
          {lead.program ? programLabel(lead.program) : (lead.schools?.name ?? "—")}
        </p>
        <p className="mt-1 text-xs text-slate-400">{leadStageLabel(lead.lead_stage)}</p>
        {current?.locked ? (
          <p className="mt-2 text-xs font-medium text-slate-500">
            Moved from Finalizing Contract only
          </p>
        ) : (
        <select
          value={current?.key ?? ""}
          disabled={action.isBusy}
          onClick={stop}
          onKeyDown={stop}
          onChange={(e) => handleChoice(lead, e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
          aria-busy={action.isBusy || undefined}
          aria-label={`Stage for ${lead.first_name} ${lead.last_name}`}
        >
          {choosableBoardGroupsFor(lead.school_id).map((g) => (
            <option key={g.key} value={g.key}>
              {boardGroupChoiceLabel(g, current?.key)}
            </option>
          ))}
          <option value={QUIET_OPTION}>Move to Quiet</option>
        </select>
        )}
      </div>
    );
  }

  function renderColumn(group: BoardGroup, groupLeads: readonly BoardLead[]) {
    if (group.key === "decision" && visibleDecisionGates) {
      return (
        <BoardDecisionColumn
          key={group.key}
          gates={visibleDecisionGates}
          title={boardGroupLabel(group)}
          extraCount={groupLeads.length}
        >
          {groupLeads.map(renderCard)}
        </BoardDecisionColumn>
      );
    }
    return (
      <div
        key={group.key}
        className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50"
      >
        <div className="border-b border-slate-200/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${group.color}`}>
              {boardGroupLabel(group)}
            </span>
            <span className="text-xs font-medium text-slate-500">{groupLeads.length}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          {groupLeads.map(renderCard)}
          {groupLeads.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">No cases</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <ScheduleAppointmentDialog
        key={pending ? `${pending.leadId}:${pending.stage}` : "closed"}
        open={pending !== null}
        stage={pending?.stage ?? null}
        studentName={pending?.studentName ?? ""}
        busy={action.isBusy}
        onCancel={() => setPending(null)}
        onConfirm={confirmAppointment}
      />
      <PipelineFilters
        leads={allLeads}
        filters={filters}
        shownCount={visibleLeads.length}
        onChange={setFilters}
      />
      <BoardScroller columnCount={columns.length}>
        {columns.map(({ group, groupLeads }) => renderColumn(group, groupLeads))}
      </BoardScroller>
    </>
  );
}

export const AdmissionsCasePipelineBoard = AdmissionsPipelineBoard;
