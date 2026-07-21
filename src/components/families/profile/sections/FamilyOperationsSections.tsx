import Link from "next/link";
import { ProfileRecordTable } from "@/components/platform/profile-sections/ProfileRecordTable";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import type { PortalCalendarEvent } from "@/lib/portal/calendar";
import {
  formatLabel,
  missingSection,
  nestedName,
} from "@/components/families/profile/sections/shared";

export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    uploaded: Record<string, unknown>[];
    expiring: Record<string, unknown>[];
    expired: Record<string, unknown>[];
    missingChecklist: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Documents", "partial");

  const docColumns = [
    {
      key: "student",
      label: "Student",
      render: (row: Record<string, unknown>) => nestedName(row),
    },
    { key: "document_type", label: "Type", render: (row: Record<string, unknown>) => formatLabel(row.document_type) },
    { key: "file_name", label: "File" },
    { key: "expires_at", label: "Expires", render: (row: Record<string, unknown>) => formatLabel(row.expires_at) },
  ];

  return (
    <div className="space-y-6">
      <ProfileRecordTable
        title="Uploaded Documents"
        records={data.uploaded}
        emptyMessage="No documents uploaded"
        columns={docColumns}
      />
      <ProfileRecordTable
        title="Expiring Soon (30 days)"
        records={data.expiring}
        emptyMessage="No documents expiring within 30 days"
        columns={docColumns}
      />
      <ProfileRecordTable
        title="Expired Documents"
        records={data.expired}
        emptyMessage="No expired documents"
        columns={docColumns}
      />
      <ProfileRecordTable
        title="Missing Checklist Items"
        records={data.missingChecklist}
        emptyMessage="No missing admissions documents"
        columns={[
          {
            key: "label",
            label: "Item",
            render: (row) => {
              const template = row.admissions_checklist_template_items as
                | { label?: string }
                | { label?: string }[]
                | null;
              const item = Array.isArray(template) ? template[0] : template;
              return formatLabel(item?.label ?? row.item_key);
            },
          },
          { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
        ]}
      />
    </div>
  );
}

export function FormsSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    submissions: Record<string, unknown>[];
    pendingChecklist: Record<string, unknown>[];
  } | null;
  if (!data) return missingSection("Forms", "partial");

  return (
    <div className="space-y-6">
      <ProfileRecordTable
        title="Submitted Portal Forms"
        records={data.submissions}
        emptyMessage="No portal form submissions on file"
        columns={[
          {
            key: "title",
            label: "Form",
            render: (row) => {
              const template = row.portal_form_templates as { title?: string } | { title?: string }[] | null;
              const item = Array.isArray(template) ? template[0] : template;
              return formatLabel(item?.title);
            },
          },
          { key: "student", label: "Student", render: (row) => nestedName(row) },
          { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
          { key: "submitted_at", label: "Submitted" },
        ]}
      />

      <ProfileRecordTable
        title="Pending Form / Checklist Items"
        records={data.pendingChecklist}
        emptyMessage="No pending form requirements"
        columns={[
          {
            key: "label",
            label: "Item",
            render: (row) => {
              const template = row.admissions_checklist_template_items as { label?: string } | null;
              return formatLabel(template?.label ?? row.item_key);
            },
          },
          { key: "status", label: "Status", render: (row) => formatLabel(row.status) },
        ]}
      />
    </div>
  );
}

export function CalendarSection(props: ProfileSectionViewProps) {
  const data = props.data as {
    events: Array<PortalCalendarEvent | { id: string; title: string; start: string; category: string; studentName?: string }>;
    familyId?: string;
  } | null;
  if (!data) return missingSection("Calendar", "partial");

  return (
    <ProfileCard title="Household Calendar (90 days)">
      {data.familyId ? (
        <p className="mb-3 text-sm">
          <Link
            href={`/dashboard/calendar?view=agenda&familyId=${data.familyId}`}
            className="font-medium text-brand-700 underline"
          >
            Open full family calendar
          </Link>
        </p>
      ) : null}
      {data.events.length === 0 ? (
        <ProfileEmpty>No upcoming calendar events</ProfileEmpty>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.events.map((event) => (
            <li key={event.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{event.title}</span>
                <span className="text-xs capitalize text-slate-500">
                  {String(event.category).replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-slate-500">
                {new Date(event.start).toLocaleString()}
                {"studentName" in event && event.studentName ? ` · ${event.studentName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
