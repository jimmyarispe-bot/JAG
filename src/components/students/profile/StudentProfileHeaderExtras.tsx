import Link from "next/link";
import { SuccessScoreBadge } from "@/components/students/SuccessScoreBadge";
import { StudentLifecycleActions } from "@/components/students/StudentLifecycleActions";
import { gradeLabel } from "@/lib/constants/grades";
import { programLabel } from "@/lib/constants/programs";
import type { ExecutiveSummary } from "@/lib/ssis/queries";
import type { StudentRecord } from "@/lib/students/queries";

export function StudentProfileAvatar({ student }: { student: StudentRecord }) {
  const initial = student.first_name[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-lg font-bold text-brand-700">
      {student.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={student.photo_url} alt="" className="h-14 w-14 object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

export function StudentProfileBadges({
  student,
  summary,
}: {
  student: StudentRecord;
  summary: ExecutiveSummary;
}) {
  return (
    <>
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
        {gradeLabel(student.grade_level)}
      </span>
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
        {student.status === "archived" ? "archived" : student.enrollment_status}
      </span>
      {student.status === "archived" && (
        <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-white">
          Archived
        </span>
      )}
      {student.program && (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {programLabel(student.program)}
        </span>
      )}
      {summary.successScore && (
        <SuccessScoreBadge
          score={summary.successScore.overallScore}
          indicator={summary.successScore.statusIndicator}
        />
      )}
      {summary.medicalAlertCount > 0 && (
        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {summary.medicalAlertCount} medical alerts
        </span>
      )}
    </>
  );
}

export function StudentProfileHeaderAlerts({ summary }: { summary: ExecutiveSummary }) {
  const alerts: { tone: string; text: string }[] = [];

  if (summary.spedReviewDue) {
    alerts.push({ tone: "border-amber-200 bg-amber-50 text-amber-800", text: "Special education review due within 30 days." });
  }
  if (summary.parentDisengaged) {
    alerts.push({ tone: "border-amber-200 bg-amber-50 text-amber-800", text: "Low parent engagement detected." });
  }
  if (summary.missionControlAlertCount > 0) {
    alerts.push({
      tone: "border-rose-200 bg-rose-50 text-rose-800",
      text: `${summary.missionControlAlertCount} open Mission Control alert(s).`,
    });
  }

  if (!alerts.length) return null;

  return (
    <>
      {alerts.map((a) => (
        <div key={a.text} className={`rounded-xl border px-4 py-3 text-sm ${a.tone}`}>
          {a.text}
        </div>
      ))}
    </>
  );
}

export function StudentProfileHeaderActions({
  studentId,
  admissionsLeadId,
  isArchived = false,
  canManageLifecycle = false,
}: {
  studentId: string;
  admissionsLeadId?: string | null;
  isArchived?: boolean;
  canManageLifecycle?: boolean;
}) {
  return (
    <>
      <Link
        href={`/dashboard/teacher/students/${studentId}`}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Teacher workspace
      </Link>
      {admissionsLeadId && (
        <Link
          href={`/dashboard/admissions/leads/${admissionsLeadId}`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Admissions history
        </Link>
      )}
      {canManageLifecycle && (
        <StudentLifecycleActions studentId={studentId} isArchived={isArchived} variant="header" />
      )}
    </>
  );
}
