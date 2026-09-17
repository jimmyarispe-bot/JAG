import Link from "next/link";
import {
  ProfileCard,
  ProfileEmpty,
} from "@/components/platform/profile-workspace/ProfilePrimitives";
import { PersonDocumentsPanel } from "@/components/people/PersonDocumentsPanel";
import type { ProfileSectionViewProps } from "@/lib/platform/profile/sections/types";
import { missing } from "./shared";

interface PlatformDocumentRow {
  id: string;
  title: string | null;
  file_name: string | null;
  category: string | null;
  created_at: string | null;
  filedOn: string;
}

interface ApplicationDocumentRow {
  id: string;
  document_type: string | null;
  document_subtype: string | null;
  file_name: string | null;
  created_at: string | null;
}

interface ChecklistItem {
  id: string;
  item_key: string;
  status: string;
  template?: { label?: string; is_required?: boolean } | undefined;
}

interface DocumentsData {
  leadId: string;
  studentId: string | null;
  studentName: string | null;
  applicationId: string | null;
  applicationDocuments: ApplicationDocumentRow[];
  platformDocuments: PlatformDocumentRow[];
  checklist: { items: ChecklistItem[]; percentComplete: number } | null;
  canEdit: boolean;
}

function whenever(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanise(value: string | null): string {
  if (!value) return "Document";
  return value.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const CHECKLIST_DONE = new Set(["completed", "waived", "not_applicable"]);

/**
 * Everything filed against this child, wherever it was filed.
 *
 * The panels are separate because the stores are separate and behave
 * differently - the two person panels can upload, the other two are read-only
 * views of files that arrived some other way. Merging them into one list would
 * mean a row whose buttons work and a row whose buttons do not, which is worse
 * than four honest headings.
 */
export function DocumentsSection(props: ProfileSectionViewProps) {
  const data = props.data as DocumentsData | null;
  if (!data) return missing("Documents");

  const { platformDocuments, applicationDocuments, checklist } = data;
  const checklistItems = checklist?.items ?? [];

  return (
    <div className="space-y-4">
      <PersonDocumentsPanel
        subjectType="lead"
        subjectId={data.leadId}
        canEdit={data.canEdit}
      />

      {data.studentId && (
        <div>
          <p className="px-1 pb-2 text-sm text-slate-500">
            Filed on the student record for{" "}
            <span className="font-medium text-slate-700">
              {data.studentName || "this child"}
            </span>
            .
          </p>
          <PersonDocumentsPanel
            subjectType="student"
            subjectId={data.studentId}
            canEdit={data.canEdit}
          />
        </div>
      )}

      {platformDocuments.length > 0 && (
        <ProfileCard title="In the Documents module">
          <ul className="divide-y divide-slate-100">
            {platformDocuments.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {doc.title || doc.file_name || "Untitled document"}
                </Link>
                {doc.category && (
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {humanise(doc.category)}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  Filed on {doc.filedOn}
                  {whenever(doc.created_at) ? ` · ${whenever(doc.created_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </ProfileCard>
      )}

      {applicationDocuments.length > 0 && (
        <ProfileCard title="Sent with the application">
          <ul className="divide-y divide-slate-100">
            {applicationDocuments.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2">
                <span className="text-sm font-medium text-slate-800">
                  {doc.file_name || humanise(doc.document_type)}
                </span>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {humanise(doc.document_subtype || doc.document_type)}
                </span>
                {whenever(doc.created_at) && (
                  <span className="text-xs text-slate-500">{whenever(doc.created_at)}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="pt-2 text-xs text-slate-500">
            These arrived with the application form. They are listed here so nothing is
            invisible; opening them from this tab is not built yet.
          </p>
        </ProfileCard>
      )}

      <ProfileCard title="Application checklist">
        {!data.applicationId ? (
          <ProfileEmpty>
            No application has been started, so there is no checklist yet. That does not
            mean the family sent nothing &mdash; anything uploaded is in the panels above.
          </ProfileEmpty>
        ) : checklistItems.length === 0 ? (
          <ProfileEmpty>This application has no checklist items.</ProfileEmpty>
        ) : (
          <>
            <p className="pb-2 text-sm text-slate-600">
              {checklist?.percentComplete ?? 0}% of the required items are done.
            </p>
            <ul className="divide-y divide-slate-100">
              {checklistItems.map((item) => {
                const done = CHECKLIST_DONE.has(item.status);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-2"
                  >
                    <span className="text-sm text-slate-800">
                      {item.template?.label || humanise(item.item_key)}
                      {item.template?.is_required && (
                        <span className="ml-1.5 text-xs text-slate-400">required</span>
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        done ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {humanise(item.status)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ProfileCard>
    </div>
  );
}
