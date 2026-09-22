"use client";

import { useState } from "react";
import {
  EXPORT_FIELDS,
  EXPORT_FIELD_GROUPS,
  EXPORT_PRESETS,
} from "@/lib/students/export";
import { exportStudentsCsvAction } from "@/lib/students/export-actions";
import type { StudentListStatusFilter } from "@/lib/students/queries";

interface ExportStudentsButtonProps {
  statusFilter: StudentListStatusFilter;
  schoolId?: string;
  campusName?: string | null;
  /** How many students the current filters match, for the button's label. */
  studentCount: number;
}

/**
 * Download the students currently on screen, with a choice of fields.
 *
 * WHY A PICKER RATHER THAN ONE FIXED FILE. The three real uses want different
 * things: a state form wants dates of birth and ethnicity, a contact sheet
 * wants parents' phone numbers, a class list wants neither. One file that
 * serves all three is a file carrying every child's personal details to every
 * desk that only needed a list of names.
 *
 * "Select all" exists but is not a preset, because choosing to export
 * everything about every child should take a deliberate click.
 */
export function ExportStudentsButton({
  statusFilter,
  schoolId,
  campusName,
  studentCount,
}: ExportStudentsButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    EXPORT_PRESETS.class_list.keys as string[]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function applyPreset(presetKey: string) {
    const preset = EXPORT_PRESETS[presetKey];
    if (preset) setSelected([...preset.keys]);
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const result = await exportStudentsCsvAction({
        statusFilter,
        schoolId,
        campusName,
        fields: selected,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      /*
       * Blob rather than a server round-trip for the file itself: the CSV is
       * already in hand, and a data: URL large enough for 107 students with
       * every field would be refused by some browsers.
       */
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The export failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Export ({studentCount})
      </button>
    );
  }

  const sensitive = selected.some((k) =>
    ["date_of_birth", "hispanic_or_latino", "race", "primary_address"].includes(k)
  );

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Export {studentCount} student{studentCount === 1 ? "" : "s"}
          {campusName ? ` — ${campusName}` : " — all campuses"}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            title={preset.hint}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelected(EXPORT_FIELDS.map((f) => f.key))}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => setSelected([])}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>

      <div className="mb-4 grid max-h-80 grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_FIELD_GROUPS.map((group) => {
          const fields = EXPORT_FIELDS.filter((f) => f.group === group);
          if (fields.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group}
              </p>
              <ul className="space-y-1">
                {fields.map((field) => (
                  <li key={field.key}>
                    <label className="flex items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected.includes(field.key)}
                        onChange={() => toggle(field.key)}
                        className="mt-0.5"
                      />
                      <span>{field.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {sensitive && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
          This file will contain children&apos;s personal details — dates of
          birth, ethnicity or home addresses. It leaves the platform and its
          access controls the moment it downloads.
        </p>
      )}

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={download}
          disabled={busy || selected.length === 0}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Preparing…" : "Download CSV"}
        </button>
        <span className="text-xs text-slate-500">
          {selected.length} field{selected.length === 1 ? "" : "s"} selected
        </span>
      </div>
    </div>
  );
}
