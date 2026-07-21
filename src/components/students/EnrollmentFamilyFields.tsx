"use client";

import { useMemo, useState } from "react";
import {
  GUARDIAN_RELATIONSHIPS,
  PREFERRED_CONTACT_METHODS,
} from "@/lib/constants/guardians";

export type FamilyOption = {
  id: string;
  family_name: string;
  billing_email?: string | null;
};

interface EnrollmentFamilyFieldsProps {
  families: FamilyOption[];
  /** When linking from an existing student profile */
  studentId?: string;
  studentLastName?: string;
  defaultSchoolId?: string;
  canManage?: boolean;
  /** Force Yes (existing) or No (new) — used by Student Profile CTAs */
  forcedMode?: "existing" | "new";
}

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
const labelClass = "block text-sm font-medium text-slate-700";

function GuardianFields({
  prefix,
  title,
  required,
}: {
  prefix: string;
  title: string;
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-800">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${prefix}_first_name`}>
            First Name {required ? "*" : ""}
          </label>
          <input
            id={`${prefix}_first_name`}
            name={`${prefix}_first_name`}
            required={required}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}_last_name`}>
            Last Name {required ? "*" : ""}
          </label>
          <input
            id={`${prefix}_last_name`}
            name={`${prefix}_last_name`}
            required={required}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}_relationship`}>
            Relationship {required ? "*" : ""}
          </label>
          <select
            id={`${prefix}_relationship`}
            name={`${prefix}_relationship`}
            required={required}
            className={inputClass}
            defaultValue={prefix === "emergency" ? "emergency" : "guardian"}
          >
            {prefix === "emergency" && <option value="emergency">Emergency Contact</option>}
            {GUARDIAN_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}_preferred_contact_method`}>
            Preferred Contact Method
          </label>
          <select
            id={`${prefix}_preferred_contact_method`}
            name={`${prefix}_preferred_contact_method`}
            className={inputClass}
            defaultValue="email"
          >
            {PREFERRED_CONTACT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}_email`}>
            Email {required ? "*" : ""}
          </label>
          <input
            id={`${prefix}_email`}
            name={`${prefix}_email`}
            type="email"
            required={required}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}_phone`}>
            Mobile Phone
          </label>
          <input
            id={`${prefix}_phone`}
            name={`${prefix}_phone`}
            type="tel"
            className={inputClass}
          />
        </div>
      </div>
    </fieldset>
  );
}

/**
 * Enrollment wizard family step — replaces the flat Family dropdown.
 * Emits form fields consumed by createStudent / createFamilyWithGuardians.
 */
export function EnrollmentFamilyFields({
  families,
  studentId,
  studentLastName,
  canManage = true,
  forcedMode,
}: EnrollmentFamilyFieldsProps) {
  const [mode, setMode] = useState<"unset" | "existing" | "new">(forcedMode ?? "unset");
  const [query, setQuery] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [includeSecond, setIncludeSecond] = useState(false);
  const [includeEmergency, setIncludeEmergency] = useState(false);
  const effectiveMode = forcedMode ?? mode;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return families.slice(0, 25);
    return families.filter((f) => f.family_name.toLowerCase().includes(q)).slice(0, 25);
  }, [families, query]);

  if (!canManage) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        You can view guardian contact information after a family is linked. Family records are
        managed by Admissions or School Leadership.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">Family</p>
        <p className="mt-1 text-sm text-slate-500">
          Is this student part of an existing family?
        </p>
      </div>

      {!forcedMode && (
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="family_mode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => {
                setMode("existing");
                setSelectedFamilyId("");
              }}
            />
            Yes — link an existing family
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="family_mode"
              value="new"
              checked={mode === "new"}
              onChange={() => {
                setMode("new");
                setSelectedFamilyId("");
              }}
            />
            No — create a new family
          </label>
        </div>
      )}
      {forcedMode && <input type="hidden" name="family_mode" value={forcedMode} />}

      {studentId && <input type="hidden" name="student_id" value={studentId} />}
      {studentLastName && <input type="hidden" name="student_last_name" value={studentLastName} />}

      {effectiveMode === "existing" && (
        <div className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="family_search">
              Search Existing Family
            </label>
            <input
              id="family_search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by family name…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="family_id">
              Select Family *
            </label>
            <select
              id="family_id"
              name="family_id"
              required
              className={inputClass}
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
            >
              <option value="">Select a family</option>
              {filtered.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.family_name}
                  {f.billing_email ? ` · ${f.billing_email}` : ""}
                </option>
              ))}
            </select>
            {filtered.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                No families match this search. Switch to “No” to create a new family.
              </p>
            )}
          </div>
        </div>
      )}

      {effectiveMode === "new" && (
        <div className="space-y-4">
          <input type="hidden" name="create_family" value="true" />
          <GuardianFields prefix="primary" title="Primary Guardian" required />

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="include_second_guardian"
              value="true"
              checked={includeSecond}
              onChange={(e) => setIncludeSecond(e.target.checked)}
            />
            Add Second Guardian
          </label>
          {includeSecond && <GuardianFields prefix="second" title="Second Guardian" />}

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="include_emergency_contact"
              value="true"
              checked={includeEmergency}
              onChange={(e) => setIncludeEmergency(e.target.checked)}
            />
            Add Emergency Contact
          </label>
          {includeEmergency && (
            <GuardianFields prefix="emergency" title="Emergency Contact" />
          )}

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="send_portal_invites" value="true" defaultChecked />
            Send Parent Portal invitation(s) when email is provided
          </label>
        </div>
      )}

      {effectiveMode === "unset" && (
        <p className="text-xs text-slate-500">
          Choose Yes or No to continue. You can also create the student without a family and link
          later from the Student Profile.
        </p>
      )}
    </div>
  );
}
