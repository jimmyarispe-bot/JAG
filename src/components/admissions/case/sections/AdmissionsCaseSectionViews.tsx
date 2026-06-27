"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ActivityTimelineFeed } from "@/components/platform/profile-sections/ActivityTimelineFeed";
import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { ProfileRelationshipsList } from "@/components/platform/profile-sections/ProfileRelationshipsList";
import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import {
  ProfileCard,
  ProfileEmpty,
  ProfileItem,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { AdmissionsChecklistPanel } from "@/components/admissions/AdmissionsChecklistPanel";
import { CommunicationTimeline } from "@/components/admissions/CommunicationTimeline";
import { DecisionWizard } from "@/components/admissions/DecisionWizard";
import { DuplicateWarningBanner } from "@/components/admissions/DuplicateWarningBanner";
import { EnrollmentPacketPanel } from "@/components/admissions/EnrollmentPacketPanel";
import { StaffFundingVerificationPanel } from "@/components/admissions/StaffFundingVerificationPanel";
import { StaffTimelinePanel } from "@/components/admissions/StaffTimelinePanel";
import { StageTimeline } from "@/components/admissions/StageTimeline";
import { TasksPanel } from "@/components/admissions/TasksPanel";
import { NotesPanel } from "@/components/admissions/NotesPanel";
import { pipelineStageColor, pipelineStageLabel } from "@/lib/admissions/registry";
import { updateCaseStage, updateCasePipelineStage } from "@/lib/admissions/case/actions";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { isAdmissionsCaseProfileEnvelope } from "@/lib/admissions/profile/types";
import { LEAD_STAGES, type LeadStageValue } from "@/lib/constants/admissions";
import {
  daysInCurrentStage,
  pipelineAgingClasses,
} from "@/lib/admissions/workflow";
import type { CaseDerivedLink } from "@/lib/admissions/case/orchestration";
import type { PlatformRelationship } from "@/lib/platform/relationships/types";

function missing(title: string) {
  return <ProfileSectionPlaceholder title={title} status="live" />;
}

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

export function ProspectSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    lead: Record<string, unknown>;
    guardians: Record<string, unknown>[];
  } | null;
  if (!data) return missing("Prospective Family");

  const lead = data.lead;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Prospective Student">
        <div className="space-y-2 text-sm">
          <ProfileItem
            label="Name"
            value={`${lead.first_name} ${lead.last_name}`}
          />
          {Boolean(lead.preferred_name) && (
            <ProfileItem label="Preferred" value={String(lead.preferred_name)} />
          )}
          {Boolean(lead.program) && (
            <ProfileItem label="Program" value={String(lead.program)} />
          )}
          {Boolean(lead.applying_for_grade) && (
            <ProfileItem label="Applying for" value={String(lead.applying_for_grade)} />
          )}
        </div>
      </ProfileCard>
      <ProfileCard title="Primary Guardian">
        <div className="space-y-2 text-sm">
          <ProfileItem
            label="Name"
            value={`${lead.guardian_first_name ?? ""} ${lead.guardian_last_name ?? ""}`.trim() || "—"}
          />
          {Boolean(lead.guardian_email) && (
            <ProfileItem label="Email" value={String(lead.guardian_email)} />
          )}
          {Boolean(lead.guardian_phone) && (
            <ProfileItem label="Phone" value={String(lead.guardian_phone)} />
          )}
        </div>
      </ProfileCard>
      {data.guardians.length > 0 && (
        <ProfileCard title="Additional Guardians">
          <ul className="space-y-2 text-sm">
            {data.guardians.map((g) => (
              <li key={String(g.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(g.first_name)} {String(g.last_name)}
              </li>
            ))}
          </ul>
        </ProfileCard>
      )}
    </div>
  );
}

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
  const [, startTransition] = useTransition();
  if (!data || !env) return missing("Pipeline");

  function handleLegacyStageChange(stage: string) {
    startTransition(async () => {
      await updateCaseStage(env!.leadId, stage as LeadStageValue);
    });
  }

  function handlePipelineStageChange(stage: string) {
    startTransition(async () => {
      await updateCasePipelineStage(env!.leadId, stage);
    });
  }

  return (
    <div className="space-y-6">
      <ProfileCard title="Workflow State">
        <div className="flex flex-wrap gap-3">
          <select
            value={String(data.lead.lead_stage)}
            onChange={(e) => handleLegacyStageChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
              onChange={(e) => e.target.value && handlePipelineStageChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
      </ProfileCard>
      <StageTimeline history={data.stageHistory} />
    </div>
  );
}

export function ApplicationsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    applications: Record<string, unknown>[];
    checklist: { items: unknown[]; percentComplete: number } | null;
    primaryApplicationId: string | null;
  } | null;
  if (!data || !env) return missing("Applications");

  return (
    <div className="space-y-6">
      {data.primaryApplicationId && data.checklist ? (
        <AdmissionsChecklistPanel
          applicationId={data.primaryApplicationId}
          leadId={env.leadId}
          items={data.checklist.items as Parameters<typeof AdmissionsChecklistPanel>[0]["items"]}
          percentComplete={data.checklist.percentComplete}
        />
      ) : (
        <ProfileCard title="Applications">
          <ProfileEmpty>No application on file</ProfileEmpty>
        </ProfileCard>
      )}
    </div>
  );
}

export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as { items: unknown[]; percentComplete: number } | null;
  if (!data) return missing("Documents");
  return (
    <ProfileCard title="Document Checklist">
      {data.items.length === 0 ? (
        <ProfileEmpty>No checklist items</ProfileEmpty>
      ) : (
        <p className="text-sm text-slate-600">{data.percentComplete}% complete</p>
      )}
    </ProfileCard>
  );
}

export function VisitsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    tours: Record<string, unknown>[];
    interviews: Record<string, unknown>[];
  } | null;
  if (!data) return missing("Tours & Interviews");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Tours">
        {data.tours.length === 0 ? (
          <ProfileEmpty>No tours scheduled</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.tours.map((t) => (
              <li key={String(t.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(t.scheduled_at)} — {String(t.tour_type)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileCard title="Interviews">
        {data.interviews.length === 0 ? (
          <ProfileEmpty>No interviews scheduled</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.interviews.map((i) => (
              <li key={String(i.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(i.scheduled_at)} — {String(i.interview_status)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function CommunicationsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    timeline: Parameters<typeof CommunicationTimeline>[0]["timeline"];
    communications: Parameters<typeof CommunicationTimeline>[0]["communications"];
    pendingQueue: Parameters<typeof CommunicationTimeline>[0]["pendingQueue"];
    applicationId: string | null;
    guardianEmail: string | null;
  } | null;
  if (!data || !env) return missing("Communications");

  return (
    <CommunicationTimeline
      leadId={env.leadId}
      applicationId={data.applicationId ?? null}
      guardianEmail={data.guardianEmail ?? null}
      timeline={data.timeline}
      communications={data.communications}
      pendingQueue={data.pendingQueue}
    />
  );
}

export function TasksSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as { tasks: Parameters<typeof TasksPanel>[0]["tasks"] } | null;
  if (!data || !env) return missing("Tasks");
  return <TasksPanel leadId={env.leadId} tasks={data.tasks} />;
}

export function ScholarshipsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    verifications: Parameters<typeof StaffFundingVerificationPanel>[0]["verifications"];
    applicationIds: string[];
  } | null;
  if (!data || !env) return missing("Scholarships & Funding");

  if (!data.applicationIds.length || !data.verifications.length) {
    return (
      <ProfileCard title="Scholarships & Funding">
        <ProfileEmpty>No funding records on file</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <StaffFundingVerificationPanel
      applicationId={data.applicationIds[0]!}
      leadId={env.leadId}
      verifications={data.verifications}
    />
  );
}

export function DecisionsSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    applicationId: string | null;
    studentName: string;
  } | null;
  if (!data || !env) return missing("Decisions");

  return (
    <DecisionWizard
      leadId={env.leadId}
      applicationId={data.applicationId}
      studentName={data.studentName}
    />
  );
}

export function EnrollmentSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    packet: Parameters<typeof EnrollmentPacketPanel>[0]["packet"] | null;
    applicationId: string | null;
    signerEmail: string;
  } | null;
  if (!data?.packet || !data.applicationId) {
    return (
      <ProfileCard title="Enrollment">
        <ProfileEmpty>No enrollment packet generated</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <EnrollmentPacketPanel
      packet={data.packet}
      applicationId={data.applicationId}
      signerEmail={data.signerEmail}
    />
  );
}

export function NotesSection(props: ProfileSectionViewProps) {
  const env = isAdmissionsCaseProfileEnvelope(props.envelope) ? props.envelope : null;
  const data = props.data as {
    platformNotes: Parameters<typeof ProfileNotesPanel>[0]["notes"];
    legacyNotes: Parameters<typeof NotesPanel>[0]["notes"];
  } | null;
  if (!data || !env) return missing("Notes");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileNotesPanel notes={data.platformNotes} title="Platform Notes" />
      <NotesPanel leadId={env.leadId} notes={data.legacyNotes} />
    </div>
  );
}

export function ActivitySection(props: ProfileSectionViewProps) {
  const data = props.data as {
    activity: Parameters<typeof ActivityTimelineFeed>[0]["events"];
    stageHistory: unknown[];
    audit: Parameters<typeof StaffTimelinePanel>[0]["entries"];
  } | null;
  if (!data) return missing("Activity");

  return (
    <div className="space-y-6">
      <ActivityTimelineFeed events={data.activity} title="Platform Activity" />
      <StaffTimelinePanel entries={data.audit} />
    </div>
  );
}

function DerivedRelationshipsList({ links }: { links: CaseDerivedLink[] }) {
  return (
    <ProfileCard title="Case Links">
      {links.length === 0 ? (
        <ProfileEmpty>No linked entities</ProfileEmpty>
      ) : (
        <ul className="space-y-2 text-sm">
          {links.map((link) => (
            <li key={link.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium capitalize">
                {link.relationshipType.replace(/\./g, " · ").replace(/_/g, " ")}
              </span>
              {link.href ? (
                <Link href={link.href} className="mt-1 block text-brand-600 hover:underline">
                  {link.label}
                </Link>
              ) : (
                <p className="mt-1 text-slate-600">{link.label}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}

export function RelationshipsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    platformRelationships: PlatformRelationship[];
    derived: CaseDerivedLink[];
  } | null;
  if (!data) return missing("Relationships");

  return (
    <div className="space-y-6">
      <DerivedRelationshipsList links={data.derived} />
      <ProfileRelationshipsList relationships={data.platformRelationships} title="Platform Relationships" />
    </div>
  );
}
