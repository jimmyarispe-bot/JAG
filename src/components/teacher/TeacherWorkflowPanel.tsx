import Link from "next/link";
import { Suspense } from "react";
import { SessionCardActions } from "@/components/teacher/TeacherSessionActions";
import { SessionReadinessCompact } from "@/components/instruction/SessionReadinessCompact";
import { EvidenceLibraryFilters } from "@/components/instruction/EvidenceLibraryFilters";
import type { StudentReadinessSnapshot } from "@/lib/instruction/readiness";
import type { JagProfile } from "@/lib/platform/jag-profile";
import {
  AiRecommendationCard,
  AlertCard,
  CardShell,
  ContextNavigation,
  EmptyState,
  EvidenceCard,
  InterventionCard,
  JagProfileOverviewPanel,
  NotesPanel,
  PriorityCard,
  ProgressDomainChart,
  SessionCard,
  StudentCard,
  TimelinePanel,
  type XesTimelineEntry,
} from "@/components/experience-system";
import { ArtifactForm, ProgressRecordForm, TeacherNoteForm } from "@/components/teacher/TeacherWorkspaceForms";

export type TeacherWorkflowId = "morning" | "instruction" | "evidence";

export type TodaySession = {
  id: string;
  timeDisplay: string;
  meet_link?: string | null;
  lessonStatus: string;
  roomName?: string | null;
  course?: { name?: string; academy_subject?: string; program?: string } | null;
  section?: { section_code?: string; delivery_mode?: string } | null;
  students: { id?: string; first_name?: string; last_name?: string; attendanceStatus?: string; grade_level?: string }[];
  alerts: { studentId: string; type: string; message: string }[];
};

type ComplianceItem = { type: string; severity: string; title: string; href?: string; dueDate?: string };
type Recommendation = { id: string; title: string; rationale: string; priority: "high" | "medium" | "low" };
type Intervention = {
  id: string;
  intervention_type?: string;
  review_date?: string | null;
  goal_description?: string | null;
  students?: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[] | null;
};
type LessonPlan = {
  id: string;
  title: string;
  subject_domain?: string | null;
  status?: string;
  updated_at?: string;
  objectives?: unknown[];
  materials?: unknown[];
};

const COMPLETED_STATUSES = new Set(["completed", "complete", "documented"]);

function workflowBase(workflow: TeacherWorkflowId) {
  return `/dashboard/teacher?workflow=${workflow}`;
}

function sessionStudentLabel(session: TodaySession): string {
  if (session.students.length > 1) return `${session.students.length} students`;
  const first = session.students[0];
  return first ? `${first.first_name ?? ""} ${first.last_name ?? ""}`.trim() : "No enrollments";
}

function interventionStudentName(iv: Intervention): string | undefined {
  const st = iv.students;
  if (!st) return undefined;
  const row = Array.isArray(st) ? st[0] : st;
  if (!row) return undefined;
  return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || undefined;
}

function buildScheduleTimeline(sessions: TodaySession[]): XesTimelineEntry[] {
  const now = Date.now();
  let currentMarked = false;

  return sessions.map((session) => {
    const isComplete = COMPLETED_STATUSES.has(session.lessonStatus.toLowerCase());
    let status: XesTimelineEntry["status"] = "upcoming";
    if (isComplete) status = "complete";
    else if (!currentMarked) {
      status = "current";
      currentMarked = true;
    } else if (session.alerts.length > 0) status = "warning";

    return {
      id: session.id,
      title: session.course?.name ?? "Session",
      subtitle: `${session.timeDisplay} · ${sessionStudentLabel(session)}`,
      timestamp: new Date(now).toISOString(),
      status,
      meta: (
        <Link
          href={`/dashboard/teacher/sessions/${session.id}?from=instruction`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Open session →
        </Link>
      ),
    };
  });
}

function buildPriorities(
  sessions: TodaySession[],
  compliance: ComplianceItem[],
  attentionCount: number
): { id: string; title: string; description: string; href: string; tone: "brand" | "amber" | "rose" }[] {
  const priorities: { id: string; title: string; description: string; href: string; tone: "brand" | "amber" | "rose" }[] = [];

  const nextPending = sessions.find((s) => !COMPLETED_STATUSES.has(s.lessonStatus.toLowerCase()));
  if (nextPending) {
    priorities.push({
      id: "next-session",
      title: "Deliver next session",
      description: `${nextPending.timeDisplay} — ${nextPending.course?.name ?? "Session"}`,
      href: `/dashboard/teacher/sessions/${nextPending.id}?from=instruction`,
      tone: "brand",
    });
  }

  const urgentCompliance = compliance.find((c) => c.severity === "high");
  if (urgentCompliance) {
    priorities.push({
      id: "compliance",
      title: urgentCompliance.title,
      description: "Compliance reminder — resolve before end of day",
      href: urgentCompliance.href ?? workflowBase("morning"),
      tone: "rose",
    });
  }

  if (attentionCount > 0) {
    priorities.push({
      id: "attention",
      title: `${attentionCount} student${attentionCount === 1 ? "" : "s"} need attention`,
      description: "Review alerts and interventions before instruction",
      href: `${workflowBase("morning")}#attention`,
      tone: "amber",
    });
  }

  if (!priorities.length && sessions.length) {
    priorities.push({
      id: "review-schedule",
      title: "Review today's schedule",
      description: `${sessions.length} session${sessions.length === 1 ? "" : "s"} scheduled`,
      href: workflowBase("instruction"),
      tone: "brand",
    });
  }

  return priorities.slice(0, 4);
}

function collectStudentsRequiringAttention(
  sessions: TodaySession[],
  interventions: Intervention[]
): { studentId: string; name: string; reason: string; href: string }[] {
  const byStudent = new Map<string, { studentId: string; name: string; reason: string; href: string }>();

  for (const session of sessions) {
    for (const alert of session.alerts) {
      const student = session.students.find((s) => s.id === alert.studentId);
      const name = student
        ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim()
        : "Student";
      byStudent.set(alert.studentId, {
        studentId: alert.studentId,
        name,
        reason: `${alert.type}: ${alert.message}`,
        href: student?.id
          ? `/dashboard/teacher/students/${student.id}`
          : workflowBase("instruction"),
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const iv of interventions) {
    const studentId = (iv as { student_id?: string }).student_id;
    const name = interventionStudentName(iv) ?? "Student";
    const reviewDue = iv.review_date && iv.review_date <= today;
    if (reviewDue && studentId) {
      byStudent.set(studentId, {
        studentId,
        name,
        reason: `Intervention review due — ${iv.intervention_type ?? "active plan"}`,
        href: `/dashboard/teacher/students/${studentId}`,
      });
    }
  }

  return [...byStudent.values()];
}

function WorkflowSectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </header>
  );
}

function PriorityStrip({ priorities }: { priorities: ReturnType<typeof buildPriorities> }) {
  if (!priorities.length) return null;
  return (
    <section aria-label="Today's priorities">
      <WorkflowSectionHeader title="Today's priorities" description="Start here — each action is one click away." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {priorities.map((p) => (
          <PriorityCard key={p.id} title={p.title} description={p.description} href={p.href} tone={p.tone} />
        ))}
      </div>
    </section>
  );
}

function SessionInstructionCard({
  session,
  readinessByStudent,
  highlighted = false,
}: {
  session: TodaySession;
  readinessByStudent?: Map<string, StudentReadinessSnapshot>;
  highlighted?: boolean;
}) {
  const isComplete = COMPLETED_STATUSES.has(session.lessonStatus.toLowerCase());
  const sessionHref = `/dashboard/teacher/sessions/${session.id}?from=instruction`;

  return (
    <SessionCard
      id={session.id}
      timeDisplay={session.timeDisplay}
      title={session.course?.name ?? "Session"}
      subtitle={`${session.section?.section_code ?? "—"} · ${sessionStudentLabel(session)}`}
      status={session.lessonStatus}
      statusComplete={isComplete}
      href={sessionHref}
      alerts={session.alerts.map((a) => ({ type: a.type, message: a.message }))}
      highlighted={highlighted}
      meta={
        <>
          {session.students.map((s) => {
            if (!s.id || !readinessByStudent?.has(s.id)) return null;
            return (
              <SessionReadinessCompact
                key={s.id}
                studentId={s.id}
                studentName={`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()}
                snapshot={readinessByStudent.get(s.id)!}
              />
            );
          })}
        </>
      }
      actions={
        <>
          {session.students.slice(0, 3).map((s) =>
            s.id ? (
              <Link
                key={s.id}
                href={`/dashboard/teacher/students/${s.id}`}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {s.first_name} profile
              </Link>
            ) : null
          )}
          <Link
            href={sessionHref}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {isComplete ? "Review session" : "Open session"}
          </Link>
          {session.students.length > 0 && (
            <SessionCardActions
              sessionId={session.id}
              students={session.students as { id: string; first_name?: string; last_name?: string }[]}
              lessonStatus={session.lessonStatus}
            />
          )}
        </>
      }
    />
  );
}

function MorningWorkflow({
  sessions,
  compliance,
  interventions,
  recommendations,
  workload,
  readinessByStudent,
}: {
  sessions: TodaySession[];
  compliance: ComplianceItem[];
  interventions: Intervention[];
  recommendations: Recommendation[];
  workload: Record<string, number>;
  readinessByStudent?: Map<string, StudentReadinessSnapshot>;
}) {
  const attentionStudents = collectStudentsRequiringAttention(sessions, interventions);
  const priorities = buildPriorities(sessions, compliance, attentionStudents.length);
  const scheduleEntries = buildScheduleTimeline(sessions);

  const sessionAlerts = sessions.flatMap((s) =>
    s.alerts.map((a) => ({ session: s, alert: a }))
  );

  return (
    <div className="space-y-8">
      <WorkflowSectionHeader
        title="Morning briefing"
        description="Your day at a glance — priorities, schedule, and what needs attention before instruction."
      />

      <PriorityStrip priorities={priorities} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <WorkflowSectionHeader
            title="Today's schedule"
            description={
              sessions.length
                ? `${sessions.length} session${sessions.length === 1 ? "" : "s"} — open any session to begin instruction.`
                : "No sessions scheduled for today."
            }
          />
          {sessions.length ? (
            <TimelinePanel variant="journey" entries={scheduleEntries} />
          ) : (
            <EmptyState title="No sessions on your calendar today." />
          )}
        </section>

        <section id="attention">
          <WorkflowSectionHeader
            title="Students requiring immediate attention"
            description="Alerts and intervention reviews surfaced from today's sessions."
          />
          {attentionStudents.length ? (
            <ul className="space-y-3">
              {attentionStudents.map((s) => (
                <li key={s.studentId}>
                  <Link href={s.href} className="block">
                    <CardShell interactive padding="md">
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="mt-1 text-sm text-amber-700">{s.reason}</p>
                      <span className="mt-2 inline-block text-xs font-medium text-brand-600">View profile →</span>
                    </CardShell>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No students flagged for immediate attention." />
          )}
        </section>
      </div>

      {(sessionAlerts.length > 0 || (workload.missionControlAlerts ?? 0) > 0) && (
        <section aria-label="Alerts">
          <WorkflowSectionHeader title="Alerts" description="Session and operational alerts for today." />
          <ul className="space-y-2">
            {workload.missionControlAlerts > 0 && (
              <li>
                <AlertCard
                  title="Mission Control"
                  message={`${workload.missionControlAlerts} open alert${workload.missionControlAlerts === 1 ? "" : "s"} requiring review.`}
                  severity="high"
                />
              </li>
            )}
            {sessionAlerts.map(({ session, alert }, i) => (
              <li key={`${session.id}-${i}`}>
                <AlertCard
                  title={session.course?.name ?? "Session"}
                  message={`${alert.type} — ${alert.message}`}
                  severity={alert.type === "medical" || alert.type === "behavior" ? "high" : "medium"}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendations.length > 0 && (
        <section aria-label="AI recommendations">
          <WorkflowSectionHeader title="AI recommendations" description="Suggested next steps from the execution engine." />
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <AiRecommendationCard
                key={rec.id}
                recommendation={{ ...rec, confidence: rec.priority === "high" ? 85 : rec.priority === "low" ? 55 : 70 }}
              />
            ))}
          </div>
        </section>
      )}

      {compliance.length > 0 && (
        <section aria-label="Compliance reminders">
          <WorkflowSectionHeader title="Compliance reminders" description="Documentation and obligations due today." />
          <ul className="space-y-2">
            {compliance.map((item, i) => (
              <li key={`${item.title}-${i}`}>
                <Link
                  href={item.href ?? workflowBase("morning")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:border-brand-200"
                >
                  <span className="font-medium text-slate-900">{item.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      item.severity === "high" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.severity}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="border-t border-slate-100 pt-6">
          <Link
            href={workflowBase("instruction")}
            className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Begin instruction →
          </Link>
        </section>
      )}
    </div>
  );
}

function InstructionWorkflow({
  sessions,
  rosterStudents,
  progressByDomain,
  selectedStudentId,
  selectedSessionId,
  lessonPlans,
  interventions,
  readinessByStudent,
  jagProfilesByStudent,
}: {
  sessions: TodaySession[];
  rosterStudents: { id: string; first_name?: string; last_name?: string; grade_level?: string }[];
  progressByDomain: Record<string, { assessment_date: string; current_level: number }[]>;
  selectedStudentId?: string;
  selectedSessionId?: string;
  lessonPlans: LessonPlan[];
  interventions: Intervention[];
  readinessByStudent?: Map<string, StudentReadinessSnapshot>;
  jagProfilesByStudent?: Map<string, JagProfile>;
}) {
  const pending = sessions.filter((s) => !COMPLETED_STATUSES.has(s.lessonStatus.toLowerCase()));
  const heroSession =
    (selectedSessionId && sessions.find((s) => s.id === selectedSessionId)) ??
    pending[0] ??
    sessions[0] ??
    null;

  const activeStudent =
    rosterStudents.find((s) => s.id === selectedStudentId) ?? rosterStudents[0] ?? null;

  return (
    <div className="space-y-8">
      <WorkflowSectionHeader
        title="Instruction"
        description="Open a session, review learner progress, deliver instruction, and record observations — without leaving the workflow."
      />

      {heroSession ? (
        <section aria-label="Active session">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Open session</h3>
          <SessionInstructionCard
            session={heroSession}
            readinessByStudent={readinessByStudent}
            highlighted
          />
        </section>
      ) : (
        <EmptyState title="No sessions available for instruction today." />
      )}

      {sessions.length > 1 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">All sessions today</h3>
          <div className="space-y-4">
            {sessions
              .filter((s) => !heroSession || s.id !== heroSession.id)
              .map((session) => (
                <SessionInstructionCard
                  key={session.id}
                  session={session}
                  readinessByStudent={readinessByStudent}
                />
              ))}
          </div>
        </section>
      )}

      <section aria-label="Student profiles">
        <WorkflowSectionHeader
          title="Student profiles"
          description="Jump to a growth plan or select a learner for progress and observations."
        />
        {rosterStudents.length ? (
          <>
            {rosterStudents.length > 1 && (
              <ContextNavigation
                className="mb-4"
                items={rosterStudents.map((s) => ({
                  id: s.id,
                  label: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
                  href: `${workflowBase("instruction")}&student=${s.id}`,
                  active: s.id === activeStudent?.id,
                }))}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rosterStudents.map((s) => (
                <StudentCard
                  key={s.id}
                  id={s.id}
                  name={`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()}
                  subtitle={s.grade_level ? `Grade ${s.grade_level}` : "Roster student"}
                  actions={
                    <div className="flex flex-wrap gap-3 text-xs">
                      <Link
                        href={`/dashboard/teacher/students/${s.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        View profile
                      </Link>
                      <Link
                        href={`${workflowBase("instruction")}&student=${s.id}#progress`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Competency progress
                      </Link>
                    </div>
                  }
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No students on your roster.</p>
        )}
      </section>

      {activeStudent && jagProfilesByStudent?.get(activeStudent.id) && (
        <JagProfileOverviewPanel profile={jagProfilesByStudent.get(activeStudent.id)!} />
      )}

      {activeStudent && (
        <section id="progress" aria-label="Competency progress">
          <WorkflowSectionHeader
            title="Competency progress"
            description={`Domain trends for ${activeStudent.first_name} ${activeStudent.last_name}.`}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ProgressDomainChart records={progressByDomain.reading ?? []} title="Reading progress" />
            <ProgressDomainChart records={progressByDomain.writing ?? []} title="Writing progress" />
            <ProgressDomainChart records={progressByDomain.math ?? []} title="Mathematics progress" />
            <ProgressDomainChart records={progressByDomain.structured_literacy ?? []} title="Structured Literacy" />
          </div>
        </section>
      )}

      <section aria-label="Instructional resources">
        <WorkflowSectionHeader
          title="Instructional resources"
          description="Lesson plans ready for today's delivery."
        />
        {lessonPlans.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {lessonPlans.slice(0, 6).map((plan) => (
              <li key={plan.id}>
                <CardShell padding="md">
                  <p className="font-medium text-slate-900">{plan.title}</p>
                  <p className="mt-1 text-xs text-slate-500 capitalize">
                    {plan.subject_domain?.replace(/_/g, " ") ?? "General"} · {plan.status ?? "draft"}
                  </p>
                  {Array.isArray(plan.objectives) && plan.objectives.length > 0 && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {(plan.objectives[0] as { text?: string })?.text ??
                        String(plan.objectives[0])}
                    </p>
                  )}
                  {heroSession && (
                    <Link
                      href={`/dashboard/teacher/sessions/${heroSession.id}?from=instruction`}
                      className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline"
                    >
                      Use in active session →
                    </Link>
                  )}
                </CardShell>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No lesson plans yet." description="Add objectives and materials in the session workspace." />
        )}
      </section>

      {interventions.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Active interventions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {interventions.slice(0, 4).map((iv) => (
              <InterventionCard
                key={iv.id}
                type={iv.intervention_type ?? "Intervention"}
                goal={iv.goal_description ?? undefined}
                reviewDate={iv.review_date ?? undefined}
                studentName={interventionStudentName(iv)}
              />
            ))}
          </div>
        </section>
      )}

      <NotesPanel title="Record observations">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Progress entry</h3>
            <ProgressRecordForm students={rosterStudents} />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Instructional notes</h3>
            <TeacherNoteForm students={rosterStudents} />
          </div>
        </div>
      </NotesPanel>

      <section className="border-t border-slate-100 pt-6">
        <Link
          href={workflowBase("evidence")}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Continue to evidence →
        </Link>
      </section>
    </div>
  );
}

function EvidenceWorkflow({
  rosterStudents,
  evidenceLibrary,
  evidenceFilterBasePath,
}: {
  rosterStudents: { id: string; first_name?: string; last_name?: string }[];
  evidenceLibrary: { id: string; title: string; artifact_type: string; created_at: string }[];
  evidenceFilterBasePath: string;
}) {
  return (
    <div className="space-y-6">
      <WorkflowSectionHeader
        title="Evidence"
        description="Capture instructional artifacts and browse your evidence library."
      />
      <ArtifactForm students={rosterStudents} />
      <Suspense fallback={null}>
        <EvidenceLibraryFilters basePath={evidenceFilterBasePath} />
      </Suspense>
      {evidenceLibrary.length === 0 ? (
        <EmptyState title="No evidence artifacts yet." description="Upload your first artifact above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evidenceLibrary.map((a) => (
            <EvidenceCard key={a.id} title={a.title} artifactType={a.artifact_type} createdAt={a.created_at} />
          ))}
        </div>
      )}
    </div>
  );
}

export interface TeacherWorkflowPanelProps {
  workflow: TeacherWorkflowId;
  sessions: TodaySession[];
  workload: Record<string, number>;
  progressByDomain: Record<string, { assessment_date: string; current_level: number }[]>;
  rosterStudents: { id: string; first_name?: string; last_name?: string; grade_level?: string }[];
  evidenceLibrary: { id: string; title: string; artifact_type: string; created_at: string }[];
  interventions: Intervention[];
  compliance: ComplianceItem[];
  lessonPlans: LessonPlan[];
  recommendations: Recommendation[];
  readinessByStudent?: Map<string, StudentReadinessSnapshot>;
  jagProfilesByStudent?: Map<string, JagProfile>;
  selectedStudentId?: string;
  selectedSessionId?: string;
  evidenceFilterBasePath?: string;
}

export function TeacherWorkflowPanel({
  workflow,
  sessions,
  workload,
  progressByDomain,
  rosterStudents,
  evidenceLibrary,
  interventions,
  compliance,
  lessonPlans,
  recommendations,
  readinessByStudent,
  jagProfilesByStudent,
  selectedStudentId,
  selectedSessionId,
  evidenceFilterBasePath = "/dashboard/teacher",
}: TeacherWorkflowPanelProps) {
  switch (workflow) {
    case "morning":
      return (
        <MorningWorkflow
          sessions={sessions}
          compliance={compliance}
          interventions={interventions}
          recommendations={recommendations}
          workload={workload}
          readinessByStudent={readinessByStudent}
        />
      );
    case "instruction":
      return (
        <InstructionWorkflow
          sessions={sessions}
          rosterStudents={rosterStudents}
          progressByDomain={progressByDomain}
          selectedStudentId={selectedStudentId}
          selectedSessionId={selectedSessionId}
          lessonPlans={lessonPlans}
          interventions={interventions}
          readinessByStudent={readinessByStudent}
          jagProfilesByStudent={jagProfilesByStudent}
        />
      );
    case "evidence":
      return (
        <EvidenceWorkflow
          rosterStudents={rosterStudents}
          evidenceLibrary={evidenceLibrary}
          evidenceFilterBasePath={`${evidenceFilterBasePath}?workflow=evidence`}
        />
      );
    default:
      return (
        <MorningWorkflow
          sessions={sessions}
          compliance={compliance}
          interventions={interventions}
          recommendations={recommendations}
          workload={workload}
          readinessByStudent={readinessByStudent}
        />
      );
  }
}
