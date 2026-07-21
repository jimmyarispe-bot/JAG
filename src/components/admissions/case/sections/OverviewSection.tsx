import { DuplicateWarningBanner } from "@/components/admissions/DuplicateWarningBanner";
import {
  ProfileCard,
  ProfileEmpty,
  ProfileItem,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { pipelineStageColor, pipelineStageLabel } from "@/lib/admissions/registry";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import {
  daysInCurrentStage,
  pipelineAgingClasses,
} from "@/lib/admissions/workflow";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

export function OverviewSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    lead: Record<string, unknown>;
    workflow: { pipelineStageLabel: string; pipelineStage: string | null };
    openTaskCount: number;
    applications: Record<string, unknown>[];
    duplicates: unknown[];
  } | null;
  if (!data || !env) return missing("Overview");

  const days = daysInCurrentStage(env.stageEnteredAt);

  return (
    <div className="space-y-6">
      <DuplicateWarningBanner matches={data.duplicates as Parameters<typeof DuplicateWarningBanner>[0]["matches"]} />
      <ProfileCard title="Case Summary">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileItem label="Pipeline stage" value={data.workflow.pipelineStageLabel} />
          <ProfileItem label="Legacy stage" value={String(data.lead.lead_stage).replace(/_/g, " ")} />
          <ProfileItem label="Days in stage" value={`${days}d`} />
          <ProfileItem label="Open tasks" value={String(data.openTaskCount)} />
        </div>
        {data.workflow.pipelineStage && (
          <span
            className={`mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium ${pipelineStageColor(data.workflow.pipelineStage)}`}
          >
            {pipelineStageLabel(data.workflow.pipelineStage)}
          </span>
        )}
        <span
          className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${pipelineAgingClasses(days)}`}
        >
          {days} days in current stage
        </span>
      </ProfileCard>
      <ProfileCard title="Applications">
        {data.applications.length === 0 ? (
          <ProfileEmpty>No applications started</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.applications.map((app) => (
              <li key={String(app.id)} className="rounded-lg bg-slate-50 px-3 py-2 capitalize">
                {String(app.application_status).replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}
