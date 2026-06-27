import Link from "next/link";
import { ActivityTimelineFeed } from "@/components/platform/profile-sections/ActivityTimelineFeed";
import { ProfileRelationshipsList } from "@/components/platform/profile-sections/ProfileRelationshipsList";
import { ProfileTagsList } from "@/components/platform/profile-sections/ProfileTagsList";
import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import {
  AcademicPanel,
  AttendancePanel,
  BehaviorPanel,
  DocumentsPanel,
  EngagementPanel,
  FamilyPanel,
  FundingPanel,
  MedicalPanel,
  OverviewPanel,
  PlaceholderMessagePanel,
  ProfilePanel,
  ServicesPanel,
  SpedPanel,
} from "@/components/students/profile/panels/StudentProfilePanels";
import { ProfileCard, ProfileEmpty, ProfileItem } from "@/components/students/profile/shared/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { StudentConversionLink } from "@/lib/sis/queries";
import type { ExecutiveSummary } from "@/lib/ssis/queries";
import type { GuardianRecord, SisEnrollment, StudentRecord } from "@/lib/students/queries";
import { isStudentProfileEnvelope } from "@/lib/students/profile/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { PlatformRelationship } from "@/lib/platform/relationships/types";

function displayName(student: StudentRecord): string {
  return student.preferred_name
    ? `${student.preferred_name} (${student.first_name} ${student.last_name})`
    : `${student.first_name} ${student.last_name}`;
}

export function OverviewSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    student: StudentRecord;
    summary: ExecutiveSummary;
    enrollments?: SisEnrollment[];
    conversion?: StudentConversionLink | null;
  } | null;
  if (!data?.student || !data.summary) {
    return <ProfileSectionPlaceholder title="Overview" status="live" />;
  }
  return (
    <OverviewPanel
      student={data.student}
      summary={data.summary}
      conversion={data.conversion ?? null}
      enrollments={data.enrollments ?? []}
      displayName={displayName(data.student)}
    />
  );
}

export function IdentitySection(props: ProfileSectionViewProps) {
  const data = props.data as { student: StudentRecord; tags: PlatformEntityTag[] } | null;
  if (!data?.student) {
    return <ProfileSectionPlaceholder title="Identity" status="live" />;
  }
  return (
    <div className="space-y-6">
      <ProfileTagsList tags={data.tags ?? []} />
      <ProfilePanel
        student={data.student}
        enrollments={[]}
        conversion={null}
        lifecycleHistory={[]}
      />
    </div>
  );
}

export function AdmissionsSection(props: ProfileSectionViewProps) {
  const conversion = props.data as StudentConversionLink | null;
  if (!conversion) {
    return (
      <ProfileCard title="Admissions">
        <ProfileEmpty>No admissions conversion record linked to this student.</ProfileEmpty>
      </ProfileCard>
    );
  }
  return (
    <ProfileCard title="Admissions Conversion">
      <dl className="grid gap-3 sm:grid-cols-2">
        <ProfileItem label="Lead ID" value={conversion.lead_id} />
        <ProfileItem label="Source" value={conversion.conversion_source} />
        <ProfileItem label="Converted" value={new Date(conversion.converted_at).toLocaleDateString()} />
      </dl>
      <Link
        href={`/dashboard/admissions/leads/${conversion.lead_id}`}
        className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        View admissions lead →
      </Link>
    </ProfileCard>
  );
}

export function EnrollmentSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    student: StudentRecord;
    enrollments: SisEnrollment[];
    conversion: StudentConversionLink | null;
    lifecycleHistory: Record<string, unknown>[];
  } | null;
  if (!data?.student) {
    return <ProfileSectionPlaceholder title="Enrollment" status="live" />;
  }
  return (
    <ProfilePanel
      student={data.student}
      enrollments={data.enrollments}
      conversion={data.conversion}
      lifecycleHistory={data.lifecycleHistory}
    />
  );
}

export function AcademicsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    academic: {
      profile: Record<string, unknown> | null;
      assessments: Record<string, unknown>[];
      goals: Record<string, unknown>[];
      interventions: Record<string, unknown>[];
    };
    spedPlans: Record<string, unknown>[];
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Academics" status="live" />;
  return (
    <div className="space-y-6">
      <AcademicPanel data={data.academic} />
      {data.spedPlans.length > 0 && <SpedPanel plans={data.spedPlans} reviewDue={false} />}
    </div>
  );
}

export function ProgressSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    goals: Record<string, unknown>[];
    interventions: Record<string, unknown>[];
    profile: Record<string, unknown> | null;
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Progress Monitoring" status="partial" />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard title="Goals">
        {data.goals.length === 0 ? (
          <ProfileEmpty>No progress goals on file</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.goals.map((g) => (
              <li key={String(g.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(g.goal_description ?? g.title ?? "Goal")}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileCard title="Interventions">
        {data.interventions.length === 0 ? (
          <ProfileEmpty>No active interventions</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.interventions.map((i) => (
              <li key={String(i.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(i.intervention_type)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function MapNweaSection(props: ProfileSectionViewProps) {
  const data = props.data as { connectorKey: string; results: unknown[]; message?: string } | null;
  return (
    <PlaceholderMessagePanel
      title="MAP / NWEA"
      message={
        data?.message ??
        "NWEA MAP connector results will appear here when the assessment integration is enabled."
      }
    />
  );
}

export function AttendanceSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    records: Record<string, unknown>[];
    summary: ExecutiveSummary | null;
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Attendance" status="live" />;
  return <AttendancePanel records={data.records} summary={data.summary} />;
}

export function BehaviorSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    events: Record<string, unknown>[];
    summary: ExecutiveSummary | null;
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Behavior" status="live" />;
  return <BehaviorPanel events={data.events} summary={data.summary} />;
}

export function SchedulingSection(props: ProfileSectionViewProps) {
  const data = props.data as Record<string, unknown>[] | null;
  if (!data?.length) {
    return (
      <PlaceholderMessagePanel
        title="Scheduling"
        message="No schedule entries found. Enable Scheduling in Configuration Studio for full timetable integration."
      />
    );
  }
  return (
    <ProfileCard title="Schedule">
      <ul className="space-y-2 text-sm">
        {data.map((entry) => (
          <li key={String(entry.id)} className="rounded-lg bg-slate-50 px-3 py-2">
            {String(entry.title ?? entry.course_name ?? "Schedule entry")}
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

export function SpecialEdSection(props: ProfileSectionViewProps) {
  const data = props.data as { plans: Record<string, unknown>[]; reviewDue: boolean } | null;
  return <SpedPanel plans={data?.plans ?? []} reviewDue={data?.reviewDue ?? false} />;
}

export function TherapySection(props: ProfileSectionViewProps) {
  const sessions = (props.data as Record<string, unknown>[] | null) ?? [];
  return <ServicesPanel sessions={sessions} count={sessions.length} />;
}

export function MedicalSection(props: ProfileSectionViewProps) {
  const data = props.data as { medical: Record<string, unknown> | null; alertCount: number } | null;
  return <MedicalPanel medical={data?.medical ?? null} alertCount={data?.alertCount ?? 0} />;
}

export function FamilySection(props: ProfileSectionViewProps) {
  const data = props.data as {
    student: StudentRecord;
    guardians: GuardianRecord[];
    authorizedContacts: Record<string, unknown>[];
    siblings: Record<string, unknown>[];
    households: Record<string, unknown>[];
    relationships: PlatformRelationship[];
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Family & Guardians" status="live" />;
  return (
    <div className="space-y-6">
      <FamilyPanel
        guardians={data.guardians}
        authorizedContacts={data.authorizedContacts}
        familyName={data.student?.families?.family_name}
        siblings={data.siblings}
        households={data.households}
      />
      <ProfileRelationshipsList relationships={data.relationships ?? []} />
    </div>
  );
}

export function BillingSection(props: ProfileSectionViewProps) {
  const data = props.data as { account: unknown; message?: string } | null;
  return (
    <PlaceholderMessagePanel
      title="Tuition & Billing"
      message={data?.message ?? "Family billing account details will appear when Finance is fully integrated."}
    />
  );
}

export function ScholarshipsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    funding: Record<string, unknown>[];
    scholarships: Record<string, unknown>[];
  } | null;
  const env = isStudentProfileEnvelope(props.envelope) ? props.envelope : null;
  if (!data || !env) return <ProfileSectionPlaceholder title="Scholarships" status="live" />;
  return (
    <FundingPanel records={data.scholarships.length ? data.scholarships : data.funding} summary={null} schoolId={env.schoolId ?? ""} />
  );
}

export function TransportationSection(props: ProfileSectionViewProps) {
  const data = props.data as { routes: unknown[]; message?: string } | null;
  return (
    <PlaceholderMessagePanel
      title="Transportation"
      message={data?.message ?? "Transportation routes will appear when the module is enabled."}
    />
  );
}

export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    documents: Record<string, unknown>[];
    conversion: StudentConversionLink | null;
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Documents" status="live" />;
  return <DocumentsPanel documents={data.documents} conversion={data.conversion} />;
}

export function ComplianceSection(props: ProfileSectionViewProps) {
  const data = props.data as { obligations: unknown[]; message?: string } | null;
  return (
    <PlaceholderMessagePanel
      title="Compliance"
      message={data?.message ?? "Student-scoped compliance obligations will appear here."}
    />
  );
}

export function CommunicationsSection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return (
    <ActivityTimelineFeed
      events={events}
      title="Communications"
      emptyMessage="No communication events recorded"
    />
  );
}

export function ParentEngagementSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    events: Record<string, unknown>[];
    engagementScore: number;
    portalLogins: number;
    messages: number;
    documentUploads: number;
    disengaged: boolean;
  } | null;
  if (!data) return <ProfileSectionPlaceholder title="Parent Engagement" status="live" />;
  return <EngagementPanel data={data} />;
}

export function AiInsightsSection(props: ProfileSectionViewProps) {
  const data = props.data as { message?: string } | null;
  return (
    <PlaceholderMessagePanel
      title="AI Insights"
      message={data?.message ?? "Intelligence Network recommendations will appear here."}
    />
  );
}

export function TimelineSection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return <ActivityTimelineFeed events={events} title="Activity Timeline" />;
}

export function AuditSection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return (
    <ActivityTimelineFeed
      events={events}
      title="Audit History"
      emptyMessage="No audit events recorded"
    />
  );
}
