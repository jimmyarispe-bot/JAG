"use client";

import { useActionFeedback } from "@/components/experience-system/feedback";
import {
  ProfileCard,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { StageTimeline } from "@/components/admissions/StageTimeline";
import { updateCaseStage, updateCasePipelineStage } from "@/lib/admissions/case/actions";
import { pipelineStageLabel } from "@/lib/admissions/registry";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import { LEAD_STAGES, type LeadStageValue } from "@/lib/constants/admissions";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function PipelineSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    lead: Record<string, unknown>;
    stageHistory: Parameters<typeof StageTimeline>[0]["history"];
    workflow: {
      pipelineStage: string | null;
      allowedPipelineTransitions: string[];
    };
  } | null;
  const stageAction = useActionFeedback({
    verb: "save",
    labels: { idle: "Update stage", loading: "Updating…", success: "✓ Updated" },
    successToast: "✓ Stage updated.",
    errorToast: "Unable to update stage.",
    progressLabel: "Updating pipeline stage…",
  });
  if (!data || !env) return missing("Pipeline");

  function handleLegacyStageChange(stage: string) {
    void stageAction.run(async () => {
      await updateCaseStage(env!.leadId, stage as LeadStageValue);
      return { success: true };
    });
  }

  function handlePipelineStageChange(stage: string) {
    void stageAction.run(async () => {
      await updateCasePipelineStage(env!.leadId, stage);
      return { success: true };
    });
  }

  return (
    <div className="space-y-6">
      <ProfileCard title="Workflow State">
        <div className="flex flex-wrap gap-3">
          <select
            value={String(data.lead.lead_stage)}
            disabled={stageAction.isBusy}
            onChange={(e) => handleLegacyStageChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
            aria-busy={stageAction.isBusy || undefined}
          >
            {LEAD_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {data.workflow.allowedPipelineTransitions.length > 0 && (
            <select
              defaultValue=""
              disabled={stageAction.isBusy}
              onChange={(e) => e.target.value && handlePipelineStageChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
              aria-busy={stageAction.isBusy || undefined}
            >
              <option value="">Advance to OS stage…</option>
              {data.workflow.allowedPipelineTransitions.map((stage) => (
                <option key={stage} value={stage}>
                  {pipelineStageLabel(stage)}
                </option>
              ))}
            </select>
          )}
        </div>
        {stageAction.errorMessage ? (
          <p className="mt-2 text-xs text-rose-700" role="alert">
            {stageAction.errorMessage}
          </p>
        ) : null}
      </ProfileCard>
      <StageTimeline history={data.stageHistory} />
    </div>
  );
}
