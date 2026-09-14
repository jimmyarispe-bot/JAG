"use client";

import Link from "next/link";
import { useState } from "react";
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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.lead_stage === stage.value);
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
                      * long note there. Programme has been null on every lead
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
    </div>
    </>
  );
}
