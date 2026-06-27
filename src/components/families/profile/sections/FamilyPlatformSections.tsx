import { ActivityTimelineFeed } from "@/components/platform/profile-sections/ActivityTimelineFeed";
import { ProfileNotesPanel } from "@/components/platform/profile-sections/ProfileNotesPanel";
import { ProfilePlaceholderPanel } from "@/components/platform/profile-sections/ProfilePlaceholderPanel";
import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import { ProfileStatGrid } from "@/components/platform/profile-sections/ProfileStatGrid";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { PlatformNote } from "@/lib/platform/notes/types";
import {
  formatLabel,
  missingSection,
  nestedName,
} from "@/components/families/profile/sections/shared";

export function CommunicationsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    activity: PlatformActivityEvent[];
    meetings: Record<string, unknown>[];
    conversations: Record<string, unknown>[];
    unreadCount: number;
  } | null;
  if (!data) return missingSection("Communications", "partial");

  return (
    <div className="space-y-6">
      <ProfileStatGrid
        items={[
          { label: "Recent messages", value: String(data.conversations.length) },
          { label: "Open threads", value: String(data.unreadCount) },
          { label: "Meetings", value: String(data.meetings.length) },
          { label: "Activity events", value: String(data.activity.length) },
        ]}
      />

      <ProfileRecordTable
        title="Recent Conversations"
        records={data.conversations}
        emptyMessage="No portal conversations on file"
        columns={[
          { key: "subject", label: "Subject" },
          { key: "category", label: "Category", render: (row) => formatLabel(row.category) },
          { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
          { key: "student", label: "Student", render: (row) => nestedName(row) },
          {
            key: "last_message_at",
            label: "Last message",
            render: (row) => formatLabel(row.last_message_at),
          },
        ]}
      />

      <ProfileRecordTable
        title="Meeting History"
        records={data.meetings}
        emptyMessage="No meetings recorded"
        columns={[
          { key: "title", label: "Meeting" },
          { key: "meeting_type", label: "Type", render: (row) => formatLabel(row.meeting_type) },
          { key: "student", label: "Student", render: (row) => nestedName(row) },
          { key: "scheduled_at", label: "Scheduled" },
          {
            key: "parent_response_status",
            label: "Response",
            render: (row) => formatLabel(row.parent_response_status),
          },
        ]}
      />

      <ActivityTimelineFeed
        events={data.activity}
        title="Communication Activity"
        emptyMessage="No communication activity recorded"
      />
    </div>
  );
}

export function NotesSection(props: ProfileSectionViewProps) {
  const notes = (props.data as PlatformNote[] | null) ?? [];
  return <ProfileNotesPanel notes={notes} title="Household Notes" limit={50} />;
}

export function ActivitySection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return (
    <ActivityTimelineFeed
      events={events}
      title="Household Activity Timeline"
      emptyMessage="No activity recorded for this household"
    />
  );
}

export function AuditSection(props: ProfileSectionViewProps) {
  const events = (props.data as PlatformActivityEvent[] | null) ?? [];
  return (
    <ActivityTimelineFeed
      events={events}
      title="Audit History"
      emptyMessage="No audit events recorded for this household"
    />
  );
}

export function AiInsightsSection(props: ProfileSectionViewProps) {
  const data = props.data as { insights: unknown[]; message?: string } | null;
  if (data?.insights?.length) {
    return (
      <ProfileCard title="AI Insights">
        <ProfileEmpty>Insights engine integration pending</ProfileEmpty>
      </ProfileCard>
    );
  }
  return (
    <ProfilePlaceholderPanel
      title="AI Insights"
      message={
        data?.message ??
        "Household intelligence recommendations will appear here when the decision intelligence module is configured."
      }
    />
  );
}
