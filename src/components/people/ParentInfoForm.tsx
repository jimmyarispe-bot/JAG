"use client";

import { useState } from "react";
import {
  FIELD_INPUT_TYPE,
  FIELD_PROMPTS,
  GRADE_OPTIONS,
  gradeLabel,
  type MissingField,
  type RequestedFields,
} from "@/lib/people/completeness-shared";
import { submitParentInfo } from "@/lib/people/parent-info-actions";

/**
 * The form a parent fills in.
 *
 * One input per missing field, grouped by child, with the child's name above
 * their fields — a parent with three children should never have to work out
 * which date of birth goes where.
 *
 * Partial answers are accepted. Someone who knows a grade but has to go and
 * find a birth certificate should be able to send what they have.
 */
export function ParentInfoForm({
  token,
  requested,
}: {
  token: string;
  requested: RequestedFields;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const key = (studentId: string | null, field: MissingField) =>
    `${studentId ?? "family"}:${field}`;

  function set(studentId: string | null, field: MissingField, value: string) {
    setValues((v) => ({ ...v, [key(studentId, field)]: value }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const answers = Object.entries(values).map(([k, value]) => {
      const [scope, field] = k.split(":");
      return { studentId: scope === "family" ? null : scope, field, value };
    });
    const result = await submitParentInfo({ token, answers });
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Thank you</h2>
        <p className="mt-2 text-emerald-800">
          That has gone straight to the school&rsquo;s records. You can close this page.
        </p>
      </div>
    );
  }

  function field(studentId: string | null, name: MissingField) {
    const id = key(studentId, name);
    return (
      <label key={id} className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          {FIELD_PROMPTS[name]}
        </span>
        {name === "grade_level" ? (
          <select
            value={values[id] ?? ""}
            onChange={(e) => set(studentId, name, e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base"
          >
            <option value="">Choose a grade…</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{gradeLabel(g)}</option>
            ))}
          </select>
        ) : (
          <input
            type={FIELD_INPUT_TYPE[name]}
            value={values[id] ?? ""}
            onChange={(e) => set(studentId, name, e.target.value)}
            autoComplete={
              name === "phone" ? "tel" : name === "email" ? "email"
              : name === "address" ? "street-address" : "off"
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base"
          />
        )}
      </label>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {requested.students.map((student) => (
        <section key={student.id} className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">{student.name}</h2>
          {student.fields.map((f) => field(student.id, f))}
        </section>
      ))}

      {requested.family.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Your household</h2>
          {requested.family.map((f) => field(null, f))}
        </section>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send to the school"}
      </button>

      <p className="text-sm text-slate-500">
        You can send what you have now and the school will follow up on anything left.
      </p>
    </div>
  );
}
