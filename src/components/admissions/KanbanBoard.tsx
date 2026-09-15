"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useActionFeedback } from "@/components/experience-system/feedback";
import { buildAdmissionsCaseHref } from "@/lib/admissions/profile/href";
import { LEAD_STAGES } from "@/lib/constants/admissions";
import { programLabel } from "@/lib/constants/programs";
import { scheduleAppointmentAndAdvance, updateLeadStage } from "@/lib/admissions/actions";
import {
  stageRequiresAppointment,
  type AppointmentStage,
} from "@/lib/admissions/appointment-stages";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { BoardScroller } from "./BoardScroller";
import { matchesQuery, type BoardLead } from "@/lib/admissions/board-filters";
import {
  daysInCurrentStage,
  pipelineAgingClasses,
  pipelineAgingDotClass,
} from "@/lib/admissions/workflow";
import type { AdmissionLead } from "@/lib/admissions/queries";

interface KanbanBoardProps {
  leads: AdmissionLead[];
}

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const searchId = useId();
  /**
   * Search, on this board too.
   *
   * There are two boards over one pipeline, and closing one door while the
   * other stands open fixes nothing — the same reason the appointment guard had
   * to be on both. A School Leader does not know which view she is looking at;
   * she knows she is looking for a child.
   *
   * The predicate is the shared one from board-filters, so "Towa" finds
   * "Oubre Towa" here exactly as it does on the pipeline board.
   */
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const visibleLeads = useMemo(
    () =>
      searching
        ? leads.filter((lead) => matchesQuery(lead as BoardLead, query))
        : leads,
    [leads, query, searching]
  );

  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Update stage", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Stage updated.",
    errorToast: "Unable to update stage.",
    progressLabel: "Updating lead stage…",
  });

  /**
   * A stage that claims an appointment cannot be entered from a dropdown.
   *
   * Picking one opens the date dialog; the stage moves only once the tour,
   * interview or shadow day has actually been booked. Every other stage is
   * unchanged. See src/lib/admissions/appointment-stages.ts for why.
   */
  const [pending, setPending] = useState<{
    leadId: string;
    stage: AppointmentStage;
    studentName: string;
  } | null>(null);

  function handleStageChange(leadId: string, stage: string, studentName: string) {
    if (stageRequiresAppointment(stage)) {
      setPending({ leadId, stage, studentName });
      return;
    }
    void action.run(async () => {
      const result = await updateLeadStage(
        leadId,
        stage as (typeof LEAD_STAGES)[number]["value"]
      );
      // useActionFeedback only treats a THROWN error as a failure, so a returned
      // { error } used to render "✓ Updated" over a stage that never moved.
      if (result && "error" in result && result.error) throw new Error(result.error);
      return { success: true };
    });
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
      // Thrown, not returned: useActionFeedback reads a rejection, not a shape.
      // The dialog stays open so the date is not lost and the card does not
      // appear to have moved.
      if (result && "error" in result && result.error) throw new Error(result.error);
      setPending(null);
      return { success: true };
    });
  }

  /** Same rule as the pipeline board: hide empty stages only while searching. */
  const visibleStages = useMemo(() => {
    const byStage = LEAD_STAGES.map((stage) => ({
      stage,
      stageLeads: visibleLeads.filter((l) => l.lead_stage === stage.value),
    }));
    return searching ? byStage.filter((s) => s.stageLeads.length > 0) : byStage;
  }, [visibleLeads, searching]);

  return (
    <>
    <ScheduleAppointmentDialog
      /* Remount per family+stage, so no field carries over from the last one. */
      key={pending ? `${pending.leadId}:${pending.stage}` : "closed"}
      open={pending !== null}
      stage={pending?.stage ?? null}
      studentName={pending?.studentName ?? ""}
      busy={action.isBusy}
      onCancel={() => setPending(null)}
      onConfirm={confirmAppointment}
    />
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <label htmlFor={searchId} className="block text-xs font-medium text-slate-600">
        Find a child or family
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, parent's name, email or phone — any part of it"
          className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Clear
          </button>
        )}
      </div>
      {searching && (
        <p className="mt-1 text-xs text-slate-500">
          {visibleLeads.length === 0
            ? "Nobody matches that. Try just the first name, or just the surname."
            : `${visibleLeads.length} match${visibleLeads.length === 1 ? "" : "es"} — empty stages are hidden while you are searching.`}
        </p>
      )}
    </div>
    <BoardScroller columnCount={visibleStages.length}>
      {visibleStages.map(({ stage, stageLeads }) => {
        return (
          <div
            key={stage.value}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50"
          >
            <div className="border-b border-slate-200/80 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-xs font-medium text-slate-500">{stageLeads.length}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              {stageLeads.map((lead) => {
                const days = daysInCurrentStage(lead.stage_entered_at);
                return (
                  <div
                    key={lead.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={buildAdmissionsCaseHref(lead.id)}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
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
                    {/*
                      * Same line, same fix as AdmissionsPipelineBoard — see the
                      * long note there. Program has been null on every lead
                      * taken through the public form since 9 September, so this
                      * rendered nothing; the campus was always present and
                      * always fetched, just never shown.
                      */}
                    <p className="mt-1 text-xs text-slate-500">
                      {lead.program ? programLabel(lead.program) : (lead.schools?.name ?? "—")}
                    </p>
                    <select
                      value={lead.lead_stage}
                      disabled={action.isBusy}
                      onChange={(e) =>
                        handleStageChange(
                          lead.id,
                          e.target.value,
                          `${lead.first_name} ${lead.last_name}`
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
                      aria-busy={action.isBusy || undefined}
                    >
                      {LEAD_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              {stageLeads.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">No leads</p>
              )}
            </div>
          </div>
        );
      })}
    </BoardScroller>
    </>
  );
}
