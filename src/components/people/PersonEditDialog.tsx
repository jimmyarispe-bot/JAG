"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMISSIONS_PIPELINE_STAGES } from "@/lib/admissions/registry/stages";
import {
  STUDENT_STATUSES,
  type DirectoryPerson,
  type PersonPatch,
  type SchoolOption,
} from "@/lib/people/directory-shared";

/**
 * One dialog for editing one person or a hundred.
 *
 * Bulk editing is the same form with every field switched off. A field only
 * joins the patch when its "Change" box is ticked, so selecting eighty students
 * to fix a school cannot quietly blank eighty phone numbers — the commonest way
 * a bulk editor does damage.
 *
 * Editing one person ticks everything and prefills from the record, so it
 * behaves like an ordinary form.
 */

const GRADES = [
  "kindergarten", "1st_grade", "2nd_grade", "3rd_grade", "4th_grade", "5th_grade",
  "6th_grade", "7th_grade", "8th_grade", "9th_grade", "10th_grade", "11th_grade", "12th_grade",
];

/** Every stage a lead may sit in, labelled by the pipeline stage it belongs to. */
const LEAD_STAGES = ADMISSIONS_PIPELINE_STAGES.flatMap((stage) =>
  stage.legacyLeadStages.map((value) => ({ value, label: `${stage.label} — ${value}` }))
);

type FieldKey = keyof PersonPatch;

const SINGLE_FIELDS: FieldKey[] = [
  "firstName", "lastName", "schoolId", "grade", "status", "dateOfBirth",
  "guardianName", "guardianEmail", "guardianPhone",
];

const BULK_FIELDS: FieldKey[] = [
  "schoolId", "grade", "status", "guardianName", "guardianEmail", "guardianPhone",
];

const LABELS: Record<FieldKey, string> = {
  firstName: "First name",
  lastName: "Last name",
  schoolId: "School",
  grade: "Grade",
  status: "Status",
  dateOfBirth: "Date of birth",
  guardianName: "Parent / guardian",
  guardianEmail: "Parent email",
  guardianPhone: "Parent phone",
};

export function PersonEditDialog({
  people,
  schools,
  onClose,
  onSave,
}: {
  people: DirectoryPerson[];
  schools: SchoolOption[];
  onClose: () => void;
  onSave: (patch: PersonPatch) => Promise<{ ok: boolean; error?: string }>;
}) {
  const bulk = people.length > 1;
  const fields = bulk ? BULK_FIELDS : SINGLE_FIELDS;
  const one = people[0];

  const kinds = useMemo(() => new Set(people.map((p) => p.kind)), [people]);
  const mixedKinds = kinds.size > 1;

  const [enabled, setEnabled] = useState<Set<FieldKey>>(
    () => new Set(bulk ? [] : SINGLE_FIELDS)
  );
  const [values, setValues] = useState<Record<string, string>>(() => ({
    firstName: one?.firstName ?? "",
    lastName: one?.lastName ?? "",
    schoolId: one?.schoolId ?? "",
    grade: one?.grade ?? "",
    status: one?.status ?? "",
    dateOfBirth: one?.dateOfBirth ?? "",
    guardianName: one?.guardianName ?? "",
    guardianEmail: one?.guardianEmail ?? "",
    guardianPhone: one?.guardianPhone ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function toggle(field: FieldKey) {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  function set(field: FieldKey, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (bulk) setEnabled((current) => new Set(current).add(field));
  }

  async function submit() {
    const patch: PersonPatch = {};
    for (const field of fields) {
      if (!enabled.has(field)) continue;
      const raw = values[field] ?? "";
      if (field === "firstName" || field === "lastName") {
        if (!raw.trim()) continue; // a name is not a thing you clear
        patch[field] = raw.trim();
      } else if (field === "schoolId" || field === "status") {
        if (!raw) continue;
        patch[field] = raw;
      } else {
        // "" here means clear the field, which is a legitimate edit.
        (patch as Record<string, unknown>)[field] = raw.trim() ? raw.trim() : null;
      }
    }

    if (!Object.keys(patch).length) {
      setError("Nothing to change — tick a field first.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onSave(patch);
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Could not save");
  }

  const statusOptions = mixedKinds
    ? []
    : kinds.has("student")
      ? STUDENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))
      : LEAD_STAGES;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={bulk ? `Edit ${people.length} people` : "Edit person"}
        className="mt-12 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {bulk ? `Edit ${people.length} selected` : `${one.lastName}, ${one.firstName}`}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {bulk
            ? "Only the fields you tick are changed. Everything else is left exactly as it is."
            : one.kind === "student"
              ? "Student record. Parent contact is written to the family and guardian records."
              : "Admissions lead. Parent contact is written to the enquiry."}
        </p>

        <div className="mt-5 space-y-3">
          {fields.map((field) => {
            const on = enabled.has(field);
            const disabled = field === "status" && mixedKinds;
            return (
              <div key={field} className="flex items-start gap-3">
                {bulk && (
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => toggle(field)}
                    aria-label={`Change ${LABELS[field]}`}
                    className="mt-2.5 h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                )}
                <label className="flex-1">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    {LABELS[field]}
                    {disabled && " — students and prospects use different vocabularies"}
                  </span>

                  {field === "schoolId" ? (
                    <select
                      value={values.schoolId}
                      disabled={disabled}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">{bulk ? "Leave unchanged" : "—"}</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : field === "status" ? (
                    <select
                      value={values.status}
                      disabled={disabled}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">{bulk ? "Leave unchanged" : "—"}</option>
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  ) : field === "grade" ? (
                    <select
                      value={values.grade}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">{bulk ? "Leave unchanged" : "— none —"}</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={
                        field === "dateOfBirth" ? "date"
                        : field === "guardianEmail" ? "email"
                        : field === "guardianPhone" ? "tel"
                        : "text"
                      }
                      value={values[field] ?? ""}
                      onChange={(e) => set(field, e.target.value)}
                      placeholder={bulk ? "Leave unchanged" : ""}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                </label>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : bulk ? `Update ${people.length}` : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
