import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";
import { ADMISSIONS_WORKFLOW_CATALOG } from "@/lib/admissions/registry/workflows";
import { ADMISSIONS_DASHBOARD_TILES } from "@/lib/admissions/registry/dashboard";
import { ADMISSIONS_ENTITIES } from "@/lib/admissions/registry/entities";
import type { AdmissionsPipelineStageKey } from "@/lib/admissions/registry/types";
import { isPipelineTransitionAllowed } from "@/lib/admissions/registry/pipeline";

export interface AdmissionsRegistryValidationIssue {
  code:
    | "duplicate_entity_key"
    | "duplicate_pipeline_stage"
    | "duplicate_workflow_key"
    | "duplicate_dashboard_tile"
    | "unmapped_legacy_stage"
    | "invalid_pipeline_transition"
    | "orphan_workflow_trigger";
  message: string;
}

export interface AdmissionsRegistryValidationResult {
  ok: boolean;
  issues: AdmissionsRegistryValidationIssue[];
}

const LEGACY_LEAD_STAGES = [
  "new_inquiry",
  "information_sent",
  "interview_scheduled",
  "interest_meeting_held",
  "tour_requested",
  "tour_scheduled",
  "tour_completed",
  "shadow_day_scheduled",
  "shadow_day_completed",
  "assessment_scheduled",
  "application_started",
  "application_submitted",
  "records_requested",
  "admissions_review",
  "accepted",
  "waitlisted",
  "declined",
  "not_returning",
  "enrolled",
] as const;

/** Validate Admissions OS registry integrity — intended for build-time checks. */
export function validateAdmissionsRegistry(): AdmissionsRegistryValidationResult {
  const issues: AdmissionsRegistryValidationIssue[] = [];

  const entityKeys = new Set<string>();
  for (const entity of ADMISSIONS_ENTITIES) {
    if (entityKeys.has(entity.key)) {
      issues.push({
        code: "duplicate_entity_key",
        message: `Duplicate admissions entity key "${entity.key}"`,
      });
    }
    entityKeys.add(entity.key);
  }

  const pipelineKeys = new Set<string>();
  for (const stage of ADMISSIONS_PIPELINE_STAGES) {
    if (pipelineKeys.has(stage.key)) {
      issues.push({
        code: "duplicate_pipeline_stage",
        message: `Duplicate pipeline stage key "${stage.key}"`,
      });
    }
    pipelineKeys.add(stage.key);
  }

  const workflowKeys = new Set<string>();
  for (const workflow of ADMISSIONS_WORKFLOW_CATALOG) {
    if (workflowKeys.has(workflow.workflowKey)) {
      issues.push({
        code: "duplicate_workflow_key",
        message: `Duplicate workflow key "${workflow.workflowKey}"`,
      });
    }
    workflowKeys.add(workflow.workflowKey);
  }

  const tileIds = new Set<string>();
  for (const tile of ADMISSIONS_DASHBOARD_TILES) {
    if (tileIds.has(tile.id)) {
      issues.push({
        code: "duplicate_dashboard_tile",
        message: `Duplicate dashboard tile id "${tile.id}"`,
      });
    }
    tileIds.add(tile.id);
  }

  const mappedLegacy = new Set(
    ADMISSIONS_PIPELINE_STAGES.flatMap((stage) => stage.legacyLeadStages)
  );
  for (const legacy of LEGACY_LEAD_STAGES) {
    if (!mappedLegacy.has(legacy)) {
      issues.push({
        code: "unmapped_legacy_stage",
        message: `Legacy lead stage "${legacy}" is not mapped to an OS pipeline stage`,
      });
    }
  }

  /**
   * THE PIPELINE MUST HAVE A WAY OUT, AND IT MUST BE THE REAL ONE.
   *
   * This asked whether `committee_review` could reach an outcome. It was the
   * right invariant pointed at the wrong stage, and on 24 September 2026 it
   * failed the build for three deployments running - the board reorder, the
   * acceptance letters, and a fix a parent was waiting on - because
   * committee_review had been taken off the board that morning. Jimmy: "we
   * don't have a committee so where did that come from."
   *
   * The invariant itself is worth keeping: a pipeline whose last working stage
   * cannot reach accepted, waitlisted or declined is a pipeline that traps
   * families. It now names the stage where the decision is actually made -
   * `shadow_day_completed`, where the accept-or-deny gate opens and where the
   * board's Decision column sits.
   *
   * WHY THE BREAK WAS INVISIBLE UNTIL A FAMILY HIT IT. `npx tsc --noEmit` and
   * the test suite both pass with this broken; only `npm run build` runs
   * `validate:admissions`, and only Vercel runs `npm run build`. The ship
   * script reported "Shipped. Vercel is building" and the build then failed
   * silently, three times - the house pattern exactly: a success message in
   * front of a failure nobody was shown.
   */
  const decisionTargets: AdmissionsPipelineStageKey[] = ["accepted", "waitlisted", "declined"];
  for (const target of decisionTargets) {
    if (!isPipelineTransitionAllowed("shadow_day_completed", target)) {
      issues.push({
        code: "invalid_pipeline_transition",
        message: `Shadow days completed cannot transition to "${target}"`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
