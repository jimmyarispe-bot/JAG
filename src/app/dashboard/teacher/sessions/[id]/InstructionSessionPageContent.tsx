import { notFound } from "next/navigation";
import { TeacherExperienceShell } from "@/components/experience-system";
import {
  InstructionCloseoutPanel,
  InstructionDeliveryPanel,
  InstructionLaunchBar,
  InstructionSessionHeader,
} from "@/components/teacher/instruction/InstructionDeliveryPanel";
import { InstructionDuringSection } from "@/components/teacher/instruction/InstructionDuringSection";
import { resolveInstructionDeliveryContext } from "@/lib/instruction/delivery-context";
import { parseImprovementAttachmentRefs } from "@/lib/instruction/continuous-improvement";
import { getSessionOutcomes } from "@/lib/instruction/outcomes";
import { buildSessionCloseoutSummary } from "@/lib/instruction/session-closeout";
import { formatAcademyTime } from "@/lib/scheduling/academy-way";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getSessionWorkspace, getTeacherEmployeeId, getTeacherRosterStudents } from "@/lib/teacher/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";

interface InstructionSessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ student?: string }>;
}

export async function InstructionSessionPageContent({ params, searchParams }: InstructionSessionPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  if (!ctx) return null;

  const workspace = await getSessionWorkspace(supabase, id);
  if (!workspace) notFound();

  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) notFound();

  const { session, students, attendance, delivery, assessments, artifacts, studentRecords } = workspace;
  const cs = Array.isArray(session.course_sections) ? session.course_sections[0] : session.course_sections;
  const course = Array.isArray(cs?.courses) ? cs.courses[0] : cs?.courses;

  const sessionStudents = (students ?? []).map((e) => {
    const st = Array.isArray(e.students) ? e.students[0] : e.students;
    return {
      id: e.student_id,
      first_name: (st as { first_name?: string })?.first_name,
      last_name: (st as { last_name?: string })?.last_name,
    };
  });

  const focusStudentId =
    sp.student && sessionStudents.some((s) => s.id === sp.student)
      ? sp.student
      : sessionStudents[0]?.id;

  if (!focusStudentId) notFound();

  const deliveryData = delivery as Record<string, unknown> | null;
  const instructionCtx = await resolveInstructionDeliveryContext({
    supabase,
    sessionId: id,
    studentId: focusStudentId,
    employeeId,
    identity: ctx,
    sessionRow: session as Record<string, unknown>,
    delivery: deliveryData,
    course: course as { name?: string } | null,
    sectionCode: (cs as { section_code?: string })?.section_code ?? "",
    scheduledLabel: `${formatAcademyTime(session.scheduled_start)} – ${formatAcademyTime(session.scheduled_end)}`,
  });

  const rosterStudents = await getTeacherRosterStudents(supabase, employeeId);
  const outcomes = await getSessionOutcomes(supabase, id);

  const attendanceMap = new Map((attendance ?? []).map((a) => [a.student_id, a.attendance_status]));
  const recordMap = new Map((studentRecords ?? []).map((r) => [r.student_id, r]));

  const contextNav = sessionStudents.map((s) => ({
    id: s.id,
    label: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
    href: `/dashboard/teacher/sessions/${id}?student=${s.id}`,
    active: s.id === focusStudentId,
  }));

  const breadcrumbs = [
    { label: "Teacher Workspace", href: "/dashboard/teacher?work=ready_to_teach" },
    { label: instructionCtx.courseName },
  ];

  const isComplete = ["completed", "complete", "documented"].includes(instructionCtx.lessonStatus.toLowerCase());

  const closeout = buildSessionCloseoutSummary(instructionCtx, {
    sessionNotes: (deliveryData?.session_notes as string | null) ?? null,
    homework: (deliveryData?.homework as string | null) ?? null,
    artifactCount: artifacts.length,
    assessmentCount: assessments.length,
    outcomeRecorded: outcomes.length > 0,
  });

  const improvementMeta = parseImprovementAttachmentRefs(deliveryData?.attachment_refs);
  const focusLoopSnapshot =
    improvementMeta.loopSnapshot?.studentId === focusStudentId
      ? improvementMeta.loopSnapshot?.analysis
      : undefined;
  if (focusLoopSnapshot) {
    closeout.improvementLoop = focusLoopSnapshot;
  }

  return (
    <TeacherExperienceShell
      navItems={[
        { id: "work", label: "Ready to teach", href: "/dashboard/teacher?work=ready_to_teach", active: false },
        { id: "session", label: "Live session", href: `/dashboard/teacher/sessions/${id}`, active: true },
        { id: "evidence", label: "Evidence work", href: "/dashboard/teacher?work=ready_for_completion", active: false },
      ]}
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      subtitle="Instructional Delivery System™ — live lesson environment"
    >
      <InstructionSessionHeader ctx={instructionCtx} breadcrumbs={breadcrumbs} contextNav={contextNav} />
      <InstructionLaunchBar ctx={instructionCtx} />
      <InstructionDeliveryPanel ctx={instructionCtx}>
        <InstructionDuringSection
          sessionId={id}
          delivery={
            deliveryData as {
              session_notes?: string | null;
              homework?: string | null;
              lesson_objectives?: unknown;
              standards?: string[] | null;
              learning_targets?: unknown;
              activities?: unknown;
              lesson_status?: string;
              attachment_refs?: unknown;
            } | null
          }
          sessionStudents={sessionStudents}
          rosterStudents={rosterStudents as typeof sessionStudents}
          attendanceMap={attendanceMap}
          recordMap={recordMap}
        />
      </InstructionDeliveryPanel>
      <InstructionCloseoutPanel summary={closeout} />
      {!isComplete && (
        <p className="text-center text-xs text-slate-500">
          Closeout preview — completes automatically when the session is marked complete.
        </p>
      )}
    </TeacherExperienceShell>
  );
}
