"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  ApplicantDocument,
  EnrollmentWizardState,
  AcademyApplicant,
} from "@academyos/admissions";
import { ENROLLMENT_WIZARD_SECTIONS } from "@academyos/admissions";
import type { SisStudent } from "@academyos/sis/types";

type SisPortalView = {
  readonly student: SisStudent;
  readonly attendance: readonly { date: string; status: string }[];
  readonly schedule: readonly { className: string; kind: string }[];
  readonly supportPlans: readonly { title: string; kind: string; status: string }[];
  readonly family: readonly { firstName: string; lastName: string; kind: string }[];
  readonly medical: SisStudent["medical"];
  readonly announcements: readonly { id: string; title: string; body: string }[];
};

type AcademicPortalView = {
  readonly schedule: readonly {
    className: string;
    subject: string;
    teacherName: string | null;
    kind: string;
  }[];
  readonly teacherAssignments: readonly {
    className: string;
    teacherName: string | null;
  }[];
  readonly upcomingSessions: readonly {
    className: string;
    date: string;
    startsAt: string;
    status: string;
  }[];
  readonly attendanceHistory: readonly { date: string; status: string }[];
  readonly calendar: readonly { date: string; title: string }[];
  readonly classAnnouncements: readonly {
    id: string;
    title: string;
    body: string;
  }[];
};

type FinancePortalView = {
  readonly outstandingBalance: number;
  readonly autoPayEnabled: boolean;
  readonly invoices: readonly {
    id: string;
    invoiceNumber: string;
    balanceDue: number;
    dueOn: string;
    status: string;
  }[];
  readonly payments: readonly {
    paidOn: string;
    amount: number;
    method: string;
  }[];
  readonly scholarships: readonly {
    fundingSource: string;
    remainingBalance: number;
    status: string;
  }[];
  readonly paymentMethods: readonly { id: string; label: string }[];
};

type LearningPortalView = {
  readonly masteryDashboard: {
    reading: { level: number | null; mastery: string | null };
    writing: { level: number | null; mastery: string | null };
    math: { level: number | null; mastery: string | null };
    structuredLiteracy: {
      level: number | null;
      step: number | null;
      mastery: string | null;
    };
  };
  readonly assessmentHistory: readonly {
    date: string;
    kind: string;
    result: string;
  }[];
  readonly teacherFeedback: readonly { date: string; body: string }[];
  readonly learningGoals: readonly {
    objectiveId: string;
    current: string;
    domain: string | null;
  }[];
  readonly interventionPlans: readonly {
    kind: string;
    goals: string;
    status: string;
  }[];
  readonly progressTimeline: readonly {
    at: string;
    from: string | null;
    to: string;
  }[];
};

export function ParentPortal({
  token,
  applicant,
  documents,
  wizard,
  sis,
  academic,
  finance,
  learning,
}: {
  readonly token: string;
  readonly applicant: AcademyApplicant | null;
  readonly documents: readonly ApplicantDocument[];
  readonly wizard: EnrollmentWizardState | null;
  readonly sis: SisPortalView | null;
  readonly academic?: AcademicPortalView | null;
  readonly finance?: FinancePortalView | null;
  readonly learning?: LearningPortalView | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("document.pdf");

  function post(action: string, body: Record<string, unknown> = {}) {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/academyos/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, ...body }),
      });
      const data = (await res.json()) as { ok?: boolean; userMessage?: string };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Request failed.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          AcademyOS™ Parent Portal
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {sis?.student.identity.preferredName ??
            (applicant
              ? `${applicant.student.firstName} ${applicant.student.lastName}`
              : "Student")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {applicant ? (
            <>
              Application: <strong>{applicant.stage}</strong> ·{" "}
              {applicant.program}
            </>
          ) : null}
          {sis ? (
            <>
              {applicant ? " · " : null}
              SIS: <strong>{sis.student.status}</strong> · Grade{" "}
              {sis.student.gradeLevel}
            </>
          ) : null}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {sis ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Student profile</h2>
            <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
              <div>Campus: {sis.student.campusName ?? "—"}</div>
              <div>Program: {sis.student.program}</div>
              <div>ID: {sis.student.identity.internalAcademyId}</div>
              <div>
                Graduation target: {sis.student.graduationTarget ?? "—"}
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Attendance</h2>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
              {sis.attendance.slice(0, 10).map((a, i) => (
                <li key={`${a.date}-${i}`}>
                  {a.date}: {a.status}
                </li>
              ))}
              {sis.attendance.length === 0 ? <li>No records yet.</li> : null}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Schedule</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {(academic?.schedule.length
                ? academic.schedule
                : sis.schedule
              ).map((c, i) => (
                <li key={`${c.className}-${i}`}>
                  {"subject" in c && c.subject
                    ? `${c.kind}: ${c.className} (${c.subject})`
                    : `${c.kind}: ${c.className}`}
                  {"teacherName" in c && c.teacherName
                    ? ` — ${c.teacherName}`
                    : null}
                </li>
              ))}
              {(academic?.schedule.length ?? sis.schedule.length) === 0 ? (
                <li>No assignments.</li>
              ) : null}
            </ul>
          </div>
          {learning ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Learning progress</h2>
              <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  Reading: Level {learning.masteryDashboard.reading.level ?? "—"}{" "}
                  ({learning.masteryDashboard.reading.mastery ?? "—"})
                </div>
                <div>
                  Writing: Level {learning.masteryDashboard.writing.level ?? "—"}{" "}
                  ({learning.masteryDashboard.writing.mastery ?? "—"})
                </div>
                <div>
                  Math: Level {learning.masteryDashboard.math.level ?? "—"} (
                  {learning.masteryDashboard.math.mastery ?? "—"})
                </div>
                <div>
                  Structured Literacy: L
                  {learning.masteryDashboard.structuredLiteracy.level ?? "—"} /
                  Step{" "}
                  {learning.masteryDashboard.structuredLiteracy.step ?? "—"}
                </div>
              </dl>
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs">
                {learning.assessmentHistory.slice(0, 5).map((a, i) => (
                  <li key={`${a.date}-${i}`}>
                    {a.date}: {a.kind} — {a.result}
                  </li>
                ))}
                {learning.assessmentHistory.length === 0 ? (
                  <li>No assessments yet.</li>
                ) : null}
              </ul>
              {learning.interventionPlans.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {learning.interventionPlans.map((p, i) => (
                    <li key={`${p.kind}-${i}`}>
                      Intervention ({p.kind}): {p.goals} — {p.status}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {finance ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Billing</h2>
              <p className="mt-1 text-xs text-slate-600">
                Balance due: ${finance.outstandingBalance.toFixed(2)} · AutoPay:{" "}
                {finance.autoPayEnabled ? "On" : "Off"}
              </p>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                {finance.invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>
                      {inv.invoiceNumber}: ${inv.balanceDue.toFixed(2)} due{" "}
                      {inv.dueOn}
                    </span>
                    {inv.balanceDue > 0 ? (
                      <button
                        type="button"
                        disabled={pending}
                        className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-white"
                        onClick={() =>
                          post("pay_invoice", {
                            invoiceId: inv.id,
                            amount: inv.balanceDue,
                            method: "Online",
                          })
                        }
                      >
                        Pay
                      </button>
                    ) : null}
                  </li>
                ))}
                {finance.invoices.length === 0 ? (
                  <li>No open invoices.</li>
                ) : null}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() =>
                    post("set_autopay", {
                      enabled: !finance.autoPayEnabled,
                    })
                  }
                >
                  {finance.autoPayEnabled ? "Disable AutoPay" : "Enable AutoPay"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  onClick={() => post("download_statement")}
                >
                  Download statement
                </button>
              </div>
              {finance.scholarships.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {finance.scholarships.map((s, i) => (
                    <li key={`${s.fundingSource}-${i}`}>
                      Scholarship: {s.fundingSource} — $
                      {s.remainingBalance.toFixed(2)} remaining
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {academic ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold">Upcoming sessions</h2>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {academic.upcomingSessions.map((s, i) => (
                    <li key={`${s.date}-${s.className}-${i}`}>
                      {s.date}: {s.className} ({s.status})
                    </li>
                  ))}
                  {academic.upcomingSessions.length === 0 ? (
                    <li>No upcoming sessions.</li>
                  ) : null}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold">Class announcements</h2>
                <ul className="mt-2 space-y-2 text-xs">
                  {academic.classAnnouncements.map((a) => (
                    <li key={a.id}>
                      <strong>{a.title}</strong> — {a.body}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Support plans</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {sis.supportPlans.map((p, i) => (
                <li key={`${p.title}-${i}`}>
                  {p.kind}: {p.title} ({p.status})
                </li>
              ))}
              {sis.supportPlans.length === 0 ? (
                <li>No active plans shared.</li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Medical & contacts</h2>
            <p className="mt-1 text-xs text-slate-600">
              Alerts: {sis.medical.medicalAlerts || "None"} · Allergies:{" "}
              {sis.medical.allergies || "None"}
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {sis.family.map((f, i) => (
                <li key={`${f.firstName}-${i}`}>
                  {f.kind}: {f.firstName} {f.lastName}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Announcements</h2>
            <ul className="mt-2 space-y-2 text-xs">
              {sis.announcements.map((a) => (
                <li key={a.id}>
                  <strong>{a.title}</strong> — {a.body}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {applicant ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Required documents</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    {d.type}{" "}
                    <span className="text-xs text-slate-500">({d.status})</span>
                  </span>
                  {d.status === "Required" || d.status === "Rejected" ? (
                    <button
                      type="button"
                      disabled={pending}
                      className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                      onClick={() =>
                        post("upload", { documentId: d.id, fileName })
                      }
                    >
                      Upload
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <label className="mt-2 block text-xs text-slate-600">
              Upload filename
              <input
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </label>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs"
                onClick={() =>
                  post("schedule_assessment", {
                    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                    assessmentSchedulingEnabled: true,
                  })
                }
              >
                Schedule assessment
              </button>
              {applicant.stage === "Accepted" ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded bg-sky-700 px-3 py-1.5 text-xs text-white"
                  onClick={() => post("accept_offer")}
                >
                  Accept enrollment offer
                </button>
              ) : null}
            </div>
          </section>

          {wizard ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Enrollment wizard</h2>
              <p className="mt-1 text-xs text-slate-500">
                Current: {wizard.currentSection} · {wizard.status}
              </p>
              <ul className="mt-3 space-y-1 text-xs">
                {ENROLLMENT_WIZARD_SECTIONS.map((s) => (
                  <li key={s} className="flex justify-between gap-2">
                    <span>{s}</span>
                    <span>
                      {wizard.completedSections.includes(s) ? "Done" : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={() =>
                    post("save_enrollment", {
                      wizardId: wizard.id,
                      section: wizard.currentSection,
                      data: { note: "saved" },
                      completeSection: true,
                    })
                  }
                >
                  Save & continue
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white"
                  onClick={() =>
                    post("submit_enrollment", { wizardId: wizard.id })
                  }
                >
                  Submit enrollment
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
