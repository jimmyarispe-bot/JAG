"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  getActiveOrderedPipelineStages,
  pipelineStageColor,
  pipelineStageLabel,
  resolvePipelineStageFromLeadStage,
} from "@/lib/admissions/registry";
import { updateCaseStage } from "@/lib/admissions/case/actions";
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
  const [, startTransition] = useTransition();
  const stages = getActiveOrderedPipelineStages();

  function handleStageChange(leadId: string, stage: LeadStageValue) {
    startTransition(async () => {
      await updateCaseStage(leadId, stage);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = leads.filter(
          (lead) => resolvePipelineStageFromLeadStage(lead.lead_stage) === stage.key
        );
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
                    {lead.program && (
                      <p className="mt-1 text-xs text-slate-500">{programLabel(lead.program)}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 capitalize">
                      {pipelineStageLabel(resolvePipelineStageFromLeadStage(lead.lead_stage) ?? stage.key)}
                    </p>
                    <select
                      value={lead.lead_stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStageValue)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
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
    </div>
  );
}

/** @deprecated Use AdmissionsPipelineBoard — legacy kanban alias */
export const AdmissionsCasePipelineBoard = AdmissionsPipelineBoard;
