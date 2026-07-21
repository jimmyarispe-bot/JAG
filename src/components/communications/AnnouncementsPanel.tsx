"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EntityActionMenu } from "@/components/platform/crud";
import {
  archiveAnnouncementAction,
  duplicateAnnouncementAction,
  publishAnnouncementAction,
} from "@/lib/communications/actions";

interface AnnouncementRow {
  id: string;
  title: string;
  body_text: string;
  target_audience: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
}

interface AnnouncementsPanelProps {
  announcements: AnnouncementRow[];
  canPublishSchoolWide: boolean;
  canCompose: boolean;
  defaultSchoolId?: string | null;
}

export function AnnouncementsPanel({
  announcements,
  canPublishSchoolWide,
  canCompose,
  defaultSchoolId,
}: AnnouncementsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold">Announcements</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {announcements.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500">No announcements yet.</li>
          ) : (
            announcements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {a.target_audience} · {a.status}
                    {a.published_at
                      ? ` · published ${new Date(a.published_at).toLocaleString()}`
                      : a.scheduled_for
                        ? ` · scheduled ${new Date(a.scheduled_for).toLocaleString()}`
                        : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body_text}</p>
                </div>
                {canCompose ? (
                  <EntityActionMenu
                    ariaLabel={`Actions for ${a.title}`}
                    actions={[
                      {
                        id: "duplicate",
                        label: "Duplicate",
                        onSelect: () => {
                          startTransition(async () => {
                            await duplicateAnnouncementAction(a.id);
                            router.refresh();
                          });
                        },
                      },
                      a.status !== "archived"
                        ? {
                            id: "archive",
                            label: "Archive",
                            onSelect: () => {
                              startTransition(async () => {
                                await archiveAnnouncementAction(a.id);
                                router.refresh();
                              });
                            },
                          }
                        : null,
                    ].filter(Boolean) as Array<{
                      id: string;
                      label: string;
                      onSelect: () => void;
                    }>}
                  />
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      {canCompose && (
        <form
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await publishAnnouncementAction(fd);
              if ("error" in result && result.error) {
                setError(result.error);
                return;
              }
              e.currentTarget.reset();
              router.refresh();
            });
          }}
        >
          <h2 className="text-sm font-semibold">Publish announcement</h2>
          <input type="hidden" name="school_id" value={defaultSchoolId ?? ""} />
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body_text"
            required
            rows={6}
            placeholder="Announcement body"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="target_audience"
            defaultValue="school"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {canPublishSchoolWide && <option value="organization">Entire organization</option>}
            {canPublishSchoolWide && <option value="school">School</option>}
            <option value="program">Program</option>
            <option value="class">Class</option>
            <option value="staff">Staff</option>
            <option value="parents">Parents</option>
            <option value="students">Students</option>
          </select>
          <input
            name="scheduled_for"
            type="datetime-local"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="publish_now" value="true" defaultChecked />
            Publish immediately
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save announcement
          </button>
        </form>
      )}
    </div>
  );
}
