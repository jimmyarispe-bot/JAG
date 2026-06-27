import { ActivityTimelineFeed } from "@/components/platform/profile-sections/ActivityTimelineFeed";
import { ProfilePlaceholderPanel } from "@/components/platform/profile-sections/ProfilePlaceholderPanel";
import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import { ProfileRelationshipsList } from "@/components/platform/profile-sections/ProfileRelationshipsList";
import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";
import {
  courseSectionLabel,
  formatLabel,
  missingSection,
} from "@/components/employees/profile/sections/shared";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { PlatformRelationship } from "@/lib/platform/relationships/types";

export function TimesheetsSection(props: ProfileSectionViewProps) {
  const data = props.data as { entries: Record<string, unknown>[] } | null;
  if (!data) return missingSection("Timesheets");

  return (
    <ProfileRecordTable
      title="Time Entries"
      records={data.entries}
      emptyMessage="No time entries on file"
      columns={[
        { key: "entry_date", label: "Date" },
        { key: "hours", label: "Hours" },
        { key: "entry_type", label: "Type", render: (row) => formatLabel(row.entry_type) },
        { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
      ]}
    />
  );
}

export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    documents: Record<string, unknown>[];
    relationships: PlatformRelationship[];
  } | null;
  if (!data) return missingSection("Documents");

  return (
    <div className="space-y-6">
      <ProfileRecordTable
        title="Document Vault"
        records={data.documents}
        emptyMessage="No documents on file"
        columns={[
          { key: "document_type", label: "Type", render: (row) => formatLabel(row.document_type) },
          { key: "file_name", label: "File" },
          { key: "created_at", label: "Uploaded", render: (row) => formatLabel(row.created_at) },
        ]}
      />
      <ProfileRelationshipsList relationships={data.relationships} title="Document Relationships" />
    </div>
  );
}

export function ComplianceSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    expiringCertifications: Record<string, unknown>[];
    pendingOnboarding: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Compliance", "partial");

  return (
    <div className="space-y-6">
      <ProfileCard title="Expiring Certifications (90 days)">
        {data.expiringCertifications.length === 0 ? (
          <ProfileEmpty>No certifications expiring within 90 days</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.expiringCertifications.map((cert) => (
              <li key={String(cert.id)} className="rounded-lg bg-amber-50 px-3 py-2">
                {String(cert.certification_name ?? "Certification")} — expires{" "}
                {String(cert.expiration_date ?? "—")}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileCard title="Pending Onboarding">
        {data.pendingOnboarding.length === 0 ? (
          <ProfileEmpty>No pending onboarding tasks organization-wide</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.pendingOnboarding.slice(0, 10).map((task) => (
              <li key={String(task.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(task.title ?? "Onboarding task")}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
    </div>
  );
}

export function ActivitySection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return <ActivityTimelineFeed events={events} title="Activity Timeline" />;
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

export function DirectReportsSection(props: ProfileSectionViewProps) {
  const relationships = (props.data as PlatformRelationship[] | null) ?? [];
  return (
    <ProfileRelationshipsList relationships={relationships} title="Direct Reports" />
  );
}

export function TeamsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    relationships: PlatformRelationship[];
    message?: string;
  } | null;
  if (!data) return missingSection("Teams", "partial");

  return (
    <div className="space-y-6">
      <ProfileRelationshipsList relationships={data.relationships} title="Team Memberships" />
      {data.message && (
        <ProfilePlaceholderPanel title="Teams" message={data.message} />
      )}
    </div>
  );
}

export function ClassesSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    courseSections: Record<string, unknown>[];
    relationships: PlatformRelationship[];
  } | null;
  if (!data) return missingSection("Classes");

  return (
    <div className="space-y-6">
      <ProfileCard title="Assigned Classes">
        {data.courseSections.length === 0 ? (
          <ProfileEmpty>No classes assigned</ProfileEmpty>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.courseSections.map((section) => (
              <li key={String(section.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {courseSectionLabel(section)}
              </li>
            ))}
          </ul>
        )}
      </ProfileCard>
      <ProfileRelationshipsList relationships={data.relationships} title="Class Relationships" />
    </div>
  );
}

export function StudentsSection(props: ProfileSectionViewProps) {
  const relationships = (props.data as PlatformRelationship[] | null) ?? [];
  return (
    <ProfileRelationshipsList relationships={relationships} title="Assigned Students" />
  );
}
