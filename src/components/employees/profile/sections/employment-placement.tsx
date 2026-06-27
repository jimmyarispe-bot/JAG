import { ProfileRelationshipsList } from "@/components/platform/profile-sections/ProfileRelationshipsList";
import { ProfilePlaceholderPanel } from "@/components/platform/profile-sections/ProfilePlaceholderPanel";
import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import { ProfileCard, ProfileEmpty, ProfileItem } from "@/components/platform/profile-workspace/ProfilePrimitives";
import { ProfileSectionPlaceholder } from "@/components/platform/profile-workspace/ProfileSectionPlaceholder";
import {
  courseSectionLabel,
  employeeSchoolName,
  formatLabel,
  missingSection,
  positionTitle,
  sessionLabel,
} from "@/components/employees/profile/sections/shared";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PlatformRelationship } from "@/lib/platform/relationships/types";

export function PositionSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    positions: Record<string, unknown>[];
    relationships: PlatformRelationship[];
  } | null;
  if (!data) return missingSection("Position");

  return (
    <div className="space-y-6">
      <ProfileRecordTable
        title="Position Assignments"
        records={data.positions}
        emptyMessage="No position assignments on file"
        columns={[
          { key: "title", label: "Title", render: positionTitle },
          {
            key: "department",
            label: "Department",
            render: (row) => {
              const positions = row.positions as { department?: string } | null;
              return formatLabel(positions?.department);
            },
          },
          { key: "start_date", label: "Start" },
          { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
        ]}
      />
      <ProfileRelationshipsList relationships={data.relationships} title="Position Relationships" />
    </div>
  );
}

export function DepartmentSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    employee: Record<string, unknown> | null;
    relationships: PlatformRelationship[];
  } | null;
  if (!data?.employee) return missingSection("Department");

  return (
    <div className="space-y-6">
      <ProfileCard title="Department">
        <ProfileItem label="Current department" value={formatLabel(data.employee.department)} />
      </ProfileCard>
      <ProfileRelationshipsList relationships={data.relationships} title="Department Relationships" />
    </div>
  );
}

export function SupervisorSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    employee: Record<string, unknown> | null;
    relationships: PlatformRelationship[];
  } | null;
  if (!data?.employee) return missingSection("Supervisor");

  const supervisorId = data.employee.supervisor_employee_id as string | null;

  return (
    <div className="space-y-6">
      <ProfileCard title="Supervisor">
        <ProfileItem
          label="Supervisor employee ID"
          value={supervisorId ? supervisorId : "Not assigned"}
        />
      </ProfileCard>
      <ProfileRelationshipsList relationships={data.relationships} title="Supervisor Relationships" />
    </div>
  );
}

export function SchoolsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    employee: Record<string, unknown> | null;
    relationships: PlatformRelationship[];
  } | null;
  if (!data?.employee) return missingSection("Schools");

  return (
    <div className="space-y-6">
      <ProfileCard title="Primary School">
        <ProfileItem label="School" value={employeeSchoolName(data.employee)} />
      </ProfileCard>
      <ProfileRelationshipsList relationships={data.relationships} title="School Assignments" />
    </div>
  );
}

export function ScheduleSection(props: ProfileSectionViewProps) {
  const data = props.data as { sessions: Record<string, unknown>[] } | null;
  if (!data) return <ProfileSectionPlaceholder title="Schedule" status="partial" />;

  if (!data.sessions.length) {
    return (
      <ProfilePlaceholderPanel
        title="Schedule"
        message="No instructional sessions scheduled. Enable Scheduling for full timetable integration."
      />
    );
  }

  return (
    <ProfileCard title="Instructional Schedule">
      <ul className="space-y-2 text-sm">
        {data.sessions.map((session) => (
          <li key={String(session.id)} className="rounded-lg bg-slate-50 px-3 py-2">
            {sessionLabel(session)}
            <span className="ml-2 text-xs capitalize text-slate-400">
              {formatLabel(session.session_status)}
            </span>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

export function WorkAssignmentsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    positions: Record<string, unknown>[];
    courseSections: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Work Assignments");

  return (
    <div className="space-y-6">
      <ProfileRecordTable
        title="Position Assignments"
        records={data.positions}
        emptyMessage="No position assignments"
        columns={[
          { key: "title", label: "Title", render: positionTitle },
          { key: "start_date", label: "Start" },
        ]}
      />
      <ProfileCard title="Course Sections">
        {data.courseSections.length === 0 ? (
          <ProfileEmpty>No course sections assigned</ProfileEmpty>
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
    </div>
  );
}
