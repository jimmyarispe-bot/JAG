"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AcademyApplicant,
  AdmissionsDashboardMetrics,
  AdmissionsStage,
} from "@academyos/admissions";
import { ADMISSIONS_STAGES } from "@academyos/admissions";

function stageClass(stage: AdmissionsStage): string {
  if (stage === "Enrolled")
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (stage === "Declined" || stage === "Withdrawn")
    return "border-slate-200 bg-slate-100 text-slate-600";
  if (stage === "Accepted" || stage === "Enrollment Pending")
    return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-amber-200 bg-amber-50 text-amber-950";
}

export function AdmissionsDashboard({
  organizationId,
  organizationName,
  dashboard,
  applicants,
}: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly dashboard: AdmissionsDashboardMetrics;
  readonly applicants: readonly AcademyApplicant[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gradeLevel: "9",
    program: "General",
    schoolName: organizationName,
    guardianFirst: "",
    guardianLast: "",
    email: "",
    phone: "",
    force: false,
  });

  const selected = applicants[0] ?? null;

  const stats = useMemo(
    () => [
      ["New inquiries", dashboard.newInquiries],
      ["Started", dashboard.applicationsStarted],
      ["Submitted", dashboard.applicationsSubmitted],
      ["Missing docs", dashboard.missingDocuments],
      ["Assessments", dashboard.assessmentsAwaitingScheduling],
      ["Pending decisions", dashboard.pendingAdmissionsDecisions],
      ["Awaiting enrollment", dashboard.acceptedAwaitingEnrollment],
      ["Enrolled this month", dashboard.enrolledThisMonth],
      ["Conversion %", dashboard.conversionRate],
      ["Avg days", dashboard.averageDaysInPipeline],
    ] as const,
    [dashboard]
  );

  function createApplicant() {
    setError(null);
    setDuplicates(null);
    startTransition(async () => {
      const res = await fetch("/api/academyos/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          force: form.force,
          program: form.program,
          gradeLevel: form.gradeLevel,
          schoolName: form.schoolName,
          student: {
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth,
            gradeLevel: form.gradeLevel,
          },
          guardian: {
            firstName: form.guardianFirst,
            lastName: form.guardianLast,
            email: form.email,
            phone: form.phone,
            relationship: "Parent",
          },
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        details?: { duplicates?: string };
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create applicant.");
        if (data.details?.duplicates) setDuplicates(data.details.duplicates);
        return;
      }
      setForm((f) => ({ ...f, firstName: "", lastName: "", force: false }));
      router.refresh();
    });
  }

  function transition(applicantId: string, stage: AdmissionsStage) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/academyos/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          action: "transition",
          applicantId,
          stage,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; userMessage?: string };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to transition.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          AcademyOS™
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Admissions & Enrollment
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Pipeline for {organizationName} — inquiry through first day of school.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
          {duplicates ? (
            <span className="mt-1 block text-xs">Matches: {duplicates}</span>
          ) : null}
          {duplicates ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium underline"
              onClick={() => {
                setForm((f) => ({ ...f, force: true }));
                setDuplicates(null);
              }}
            >
              Allow create anyway (set force)
            </button>
          ) : null}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">New inquiry</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["firstName", "Student first"],
                ["lastName", "Student last"],
                ["dateOfBirth", "DOB (YYYY-MM-DD)"],
                ["gradeLevel", "Grade"],
                ["program", "Program"],
                ["schoolName", "Campus"],
                ["guardianFirst", "Parent first"],
                ["guardianLast", "Parent last"],
                ["email", "Parent email"],
                ["phone", "Parent phone"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs text-slate-600">
                {label}
                <input
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={createApplicant}
            className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Create applicant
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Pipeline ({applicants.length})
          </div>
          <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
            {applicants.map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      {a.student.firstName} {a.student.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {a.program} · Grade {a.gradeLevel} ·{" "}
                      {a.schoolName ?? "Campus TBD"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Parent portal token:{" "}
                      <code className="rounded bg-slate-100 px-1">
                        {a.parentAccessToken.slice(0, 8)}…
                      </code>
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${stageClass(a.stage)}`}
                  >
                    {a.stage}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ADMISSIONS_STAGES.filter((s) => s !== a.stage)
                    .slice(0, 6)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={pending}
                        onClick={() => transition(a.id, s)}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50"
                      >
                        → {s}
                      </button>
                    ))}
                </div>
              </li>
            ))}
            {applicants.length === 0 ? (
              <li className="px-4 py-8 text-sm text-slate-500">
                No applicants yet.
              </li>
            ) : null}
          </ul>
          {selected ? (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Parent portal:{" "}
              <a
                className="text-sky-700 underline"
                href={`/academyos/parent?token=${encodeURIComponent(selected.parentAccessToken)}`}
              >
                Open portal
              </a>
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
