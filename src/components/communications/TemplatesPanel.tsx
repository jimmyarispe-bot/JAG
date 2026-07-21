"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EntityActionMenu } from "@/components/platform/crud";
import {
  archiveTemplateAction,
  duplicateTemplateAction,
  restoreTemplateAction,
  saveTemplateAction,
} from "@/lib/communications/actions";
import type { CommunicationTemplateRow } from "@/lib/communications/types";

interface TemplatesPanelProps {
  templates: CommunicationTemplateRow[];
  canCompose: boolean;
}

export function TemplatesPanel({ templates, canCompose }: TemplatesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Template library</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {templates.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-500">No templates yet.</li>
          ) : (
            templates.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs uppercase text-slate-400">
                    {t.category}
                    {!t.is_active ? " · archived" : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{t.subject}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Vars: {(t.variables ?? []).join(", ")} · Used {t.usage_count}×
                  </p>
                </div>
                {canCompose ? (
                  <EntityActionMenu
                    ariaLabel={`Actions for ${t.name}`}
                    actions={[
                      {
                        id: "duplicate",
                        label: "Duplicate",
                        onSelect: () => {
                          startTransition(async () => {
                            await duplicateTemplateAction(t.id);
                            router.refresh();
                          });
                        },
                      },
                      t.is_active
                        ? {
                            id: "archive",
                            label: "Archive",
                            onSelect: () => {
                              startTransition(async () => {
                                await archiveTemplateAction(t.id);
                                router.refresh();
                              });
                            },
                          }
                        : {
                            id: "restore",
                            label: "Restore",
                            onSelect: () => {
                              startTransition(async () => {
                                await restoreTemplateAction(t.id);
                                router.refresh();
                              });
                            },
                          },
                    ]}
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
              const result = await saveTemplateAction(fd);
              if ("error" in result && result.error) {
                setError(result.error);
                return;
              }
              e.currentTarget.reset();
              router.refresh();
            });
          }}
        >
          <h2 className="text-sm font-semibold text-slate-900">Save as template</h2>
          <input
            name="name"
            required
            placeholder="Template name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="category"
            placeholder="Category"
            defaultValue="general"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="subject"
            required
            placeholder="Subject (supports {{StudentName}})"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body_text"
            required
            rows={8}
            placeholder="Body with {{GuardianName}}, {{School}}, {{Teacher}}, {{Program}}"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save template
          </button>
        </form>
      )}
    </div>
  );
}
