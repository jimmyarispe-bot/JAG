"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionFeedback } from "@/components/experience-system/feedback";
import {
  getActiveOrderedPipelineStages,
  pipelineStageLabel,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";
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
import { buildAdmissionsCaseHref } from "@/lib/admissions/profile/href";
import { LEAD_STAGES, type LeadStageValue } from "@/lib/constants/admissions";
import { programLabel } from "@/lib/constants/programs";
import {
  daysInCurrentStage,
  pipelineAgingClasses,
  pipelineAgingDotClass,
} from "@/lib/admissions/workflow";
import type { AdmissionLead } from "@/lib/admissions/queries";

interface AdmissionsPipelineBoardProps {
  leads: AdmissionLead[];
}

/** OS pipeline board — groups leads by canonical pipeline stage. */
export function AdmissionsPipelineBoard({ leads }: AdmissionsPipelineBoardProps) {
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Update stage", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Stage updated.",
    errorToast: "Unable to update stage.",
    progressLabel: "Updating case stage…",
  });
  const stages = getActiveOrderedPipelineStages();

  /**
   * Filters, seeded from the URL so a narrowed board survives a refresh and can
   * be sent to somebody. PipelineFilters writes the query string back as they
   * change; this only reads it once, on mount.
   */
  const [filters, setFilters] = useState<BoardFilters>(() =>
    filtersFromParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search)
    )
  );

  const allLeads = leads as readonly BoardLead[];
  const visibleLeads = useMemo(() => applyFilters(allLeads, filters), [allLeads, filters]);

  /**
   * While somebody is SEARCHING, empty stages are hidden.
   *
   * Nineteen columns to reach one child is the problem, not the scenery. Type a
   * name and the board collapses to the stage that child is actually in, which
   * also answers the question underneath the search — "where is he?" — without
   * anybody having to scroll at all.
   *
   * Only for the free-text search, deliberately. The dropdown filters are about
   * looking at a SHAPE — how many are stuck at Application Started, whether
   * anything has reached Accepted — and a stage with nobody in it is part of
   * that answer. Removing an empty column there would hide the finding.
   */
  const stagesWithLeads = useMemo(() => {
    const byStage = stages.map((stage) => ({
      stage,
      stageLeads: visibleLeads.filter(
        (lead) => resolvePipelineStageFromLeadStage(lead.lead_stage) === stage.key
      ),
    }));
    return filters.q.trim() ? byStage.filter((s) => s.stageLeads.length > 0) : byStage;
  }, [stages, visibleLeads, filters.q]);

  /**
   * Same rule as KanbanBoard, and it has to be on both: these are two boards
   * over one pipeline, and closing one door while the other stands open would
   * have fixed nothing. See src/lib/admissions/appointment-stages.ts.
   */
  const [pending, setPending] = useState<{
    leadId: string;
    stage: AppointmentStage;
    studentName: string;
  } | null>(null);

  function handleStageChange(leadId: string, stage: LeadStageValue, studentName: string) {
    if (stageRequiresAppointment(stage)) {
      setPending({ leadId, stage, studentName });
      return;
    }
    void action.run(async () => {
      const result = await updateCaseStage(leadId, stage);
      // A returned { error } is not a rejection, so without this the board
      // showed "✓ Updated" over a stage that had not moved.
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
      if (result && "error" in result && result.error) throw new Error(result.error);
      setPending(null);
      return { success: true };
    });
  }

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
    <PipelineFilters
      leads={allLeads}
      filters={filters}
      shownCount={visibleLeads.length}
      onChange={setFilters}
    />
    <BoardScroller columnCount={stagesWithLeads.length}>
      {stagesWithLeads.map(({ stage, stageLeads }) => {
        return (
          <div
            key={stage.key}
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
                      * Campus, falling back from program.
                      *
                      * This line used to read `lead.program` alone and render
                      * nothing at all when it was null. Since 9 September
                      * (1f2cda2) the public inquiry form archives programs of
                      * interest on the interest answers and deliberately writes
                      * `p_program: null` on the lead — a family may tick more
                      * than one, and collapsing them onto a single column would
                      * pick a winner nobody chose. So every inquiry taken since
                      * has shown a blank where staff read the campus.
                      *
                      * The campus was never missing. `submit_public_admissions_inquiry`
                      * raises 'school_id is required' and checks the id exists
                      * before it will create the row, so a lead without a school
                      * cannot be made. The board simply never displayed it,
                      * though it has always been fetched — select("*, schools(name)").
                      *
                      * Program first where it is known, because its label
                      * already carries the campus ("The Academy GA – In-Person")
                      * and showing both would only repeat it. Either way the
                      * campus is on the card, which is what this line is read for.
                      */}
                    <p className="mt-1 text-xs text-slate-500">
                      {lead.program ? programLabel(lead.program) : (lead.schools?.name ?? "—")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 capitalize">
                      {pipelineStageLabel(resolvePipelineStageFromLeadStage(lead.lead_stage) ?? stage.key)}
                    </p>
                    <select
                      value={lead.lead_stage}
                      disabled={action.isBusy}
                      onChange={(e) =>
                        handleStageChange(
                          lead.id,
                          e.target.value as LeadStageValue,
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
                <p className="py-4 text-center text-xs text-slate-400">No cases</p>
              )}
            </div>
          </div>
        );
      })}
    </BoardScroller>
    </>
  );
}

/** @deprecated Use AdmissionsPipelineBoard — legacy kanban alias */
export const AdmissionsCasePipelineBoard = AdmissionsPipelineBoard;
