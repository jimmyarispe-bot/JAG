import Link from "next/link";
import { buildAdmissionsCaseSectionHref } from "@/lib/admissions/profile/href";
import { pipelineStageColor } from "@/lib/admissions/registry";
import type { AdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";

export function AdmissionsCaseProfileBadges({
  envelope,
}: {
  envelope: AdmissionsCaseProfileEnvelope;
}) {
  const color = envelope.pipelineStage
    ? pipelineStageColor(envelope.pipelineStage)
    : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {envelope.pipelineStageLabel}
    </span>
  );
}

export function AdmissionsCaseProfileHeaderActions({
  envelope,
}: {
  envelope: AdmissionsCaseProfileEnvelope;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "pipeline")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Pipeline
      </Link>
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "decisions")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Decisions
      </Link>
      <Link
        href={buildAdmissionsCaseSectionHref(envelope.caseId, "notes")}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Notes
      </Link>
    </div>
  );
}
