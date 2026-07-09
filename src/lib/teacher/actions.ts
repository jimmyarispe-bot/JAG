"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { recordSessionAttendance } from "@/lib/scheduling/attendance-bridge";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { computeStudentSuccessScore } from "@/lib/ssis/score";
import { recommendNextStructuredLiteracyStep, computeGrowth } from "@/lib/teacher/progress";
import { formatAcademyTime } from "@/lib/scheduling/academy-way";
import { getTeacherEmployeeId } from "@/lib/teacher/queries";

async function requireTeacherPermission(permission: string) {
  const ctx = await getIdentityContext();
  if (!ctx?.permissions.includes(permission) && !ctx?.permissions.includes("teacher.manage")) {
    return { error: "Permission denied" as const, ctx: null };
  }
  return { ctx, error: null };
}

export async function startLessonAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;

  await supabase.from("instructional_session_deliveries").upsert(
    {
      instructional_session_id: sessionId,
      lesson_status: "in_progress",
      started_at: new Date().toISOString(),
      started_by: ctx.effectiveUserId,
    },
    { onConflict: "instructional_session_id" }
  );

  await writePlatformAudit(supabase, {
    module: "teacher_portal",
    entityType: "instructional_sessions",
    entityId: sessionId,
    actionType: "lesson_started",
    summary: "Teacher started instructional session",
    actorUserId: ctx.effectiveUserId,
  });

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function completeSessionAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;
  const sessionNotes = (formData.get("session_notes") as string) || null;
  const homework = (formData.get("homework") as string) || null;
  const teacherReflection = (formData.get("teacher_reflection") as string) || null;
  const learnerEngagementRaw = (formData.get("learner_engagement") as string) || "unknown";
  const learnerEngagement =
    learnerEngagementRaw === "active" ||
    learnerEngagementRaw === "moderate" ||
    learnerEngagementRaw === "minimal"
      ? learnerEngagementRaw
      : "unknown";

  await supabase.from("instructional_session_deliveries").upsert(
    {
      instructional_session_id: sessionId,
      lesson_status: "completed",
      session_notes: sessionNotes,
      homework,
      completed_at: new Date().toISOString(),
      completed_by: ctx.effectiveUserId,
    },
    { onConflict: "instructional_session_id" }
  );

  await supabase
    .from("instructional_sessions")
    .update({ session_status: "completed" })
    .eq("id", sessionId);

  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);

  const { data: sessionRow } = await supabase
    .from("instructional_sessions")
    .select("*, course_sections(section_code, courses(name, school_id))")
    .eq("id", sessionId)
    .single();

  const [{ count: artifactCount }, { count: assessmentCount }, { data: deliveryRow }] =
    await Promise.all([
      supabase
        .from("student_learning_artifacts")
        .select("id", { count: "exact", head: true })
        .eq("instructional_session_id", sessionId),
      supabase
        .from("session_assessment_records")
        .select("id", { count: "exact", head: true })
        .eq("instructional_session_id", sessionId),
      supabase
        .from("instructional_session_deliveries")
        .select("*")
        .eq("instructional_session_id", sessionId)
        .maybeSingle(),
    ]);

  if (sessionRow?.course_section_id) {
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("student_id")
      .eq("course_section_id", sessionRow.course_section_id)
      .eq("enrollment_status", "enrolled");

    const { recordSessionOutcome } = await import("@/lib/instruction/outcomes");
    for (const e of enrollments ?? []) {
      await recordSessionOutcome(supabase, {
        sessionId,
        studentId: e.student_id,
        recommendedNextSteps: sessionNotes ?? undefined,
        homeworkPractice: homework ?? undefined,
        recordedBy: ctx.effectiveUserId,
        actorEmployeeId: employeeId,
      });
    }

    if (employeeId && sessionRow) {
      const cs = Array.isArray(sessionRow.course_sections)
        ? sessionRow.course_sections[0]
        : sessionRow.course_sections;
      const course = Array.isArray(cs?.courses) ? cs.courses[0] : cs?.courses;
      const sectionCode = (cs as { section_code?: string })?.section_code ?? "";
      const scheduledLabel = `${formatAcademyTime(sessionRow.scheduled_start)} – ${formatAcademyTime(sessionRow.scheduled_end)}`;
      const deliveryData = (deliveryRow ?? null) as Record<string, unknown> | null;

      const { runContinuousImprovementLoop } = await import(
        "@/lib/instruction/continuous-improvement"
      );

      for (const e of enrollments ?? []) {
        try {
          await runContinuousImprovementLoop(supabase, {
            sessionId,
            studentId: e.student_id,
            identity: ctx,
            employeeId,
            sessionRow: sessionRow as Record<string, unknown>,
            delivery: deliveryData,
            course: course as { name?: string } | null,
            sectionCode,
            scheduledLabel,
            sessionNotes,
            teacherReflection,
            learnerEngagement,
            artifactCount: artifactCount ?? 0,
            assessmentCount: assessmentCount ?? 0,
            outcomeRecorded: true,
            schoolId: (course as { school_id?: string })?.school_id,
          });
        } catch {
          // Continuous improvement must not block session completion
        }
      }
    }
  }

  await writePlatformAudit(supabase, {
    module: "teacher_portal",
    entityType: "instructional_sessions",
    entityId: sessionId,
    actionType: "session_completed",
    summary: "Teacher completed instructional session",
    actorUserId: ctx.effectiveUserId,
  });

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function updateSessionDeliveryAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;

  await supabase.from("instructional_session_deliveries").upsert(
    {
      instructional_session_id: sessionId,
      lesson_objectives: JSON.parse((formData.get("lesson_objectives") as string) || "[]"),
      standards: parseStandards(formData.get("standards") as string),
      learning_targets: JSON.parse((formData.get("learning_targets") as string) || "[]"),
      activities: JSON.parse((formData.get("activities") as string) || "[]"),
      session_notes: (formData.get("session_notes") as string) || null,
      homework: (formData.get("homework") as string) || null,
    },
    { onConflict: "instructional_session_id" }
  );

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  return { success: true };
}

export async function takeSessionAttendanceAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.attendance");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;
  const studentId = formData.get("student_id") as string;
  const status = formData.get("status") as string;
  const notifyParent = formData.get("notify_parent") === "true";

  const result = await recordSessionAttendance(supabase, {
    sessionId,
    studentId,
    status,
    notifyParent,
    recordedBy: ctx.effectiveUserId,
  });

  if (result.error) return result;

  await writePlatformAudit(supabase, {
    module: "teacher_portal",
    entityType: "instructional_sessions",
    entityId: sessionId,
    actionType: "attendance_recorded",
    summary: `Attendance ${status} for student`,
    actorUserId: ctx.effectiveUserId,
    metadata: { studentId, status },
  });

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function recordProgressAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const studentId = formData.get("student_id") as string;
  const domain = formData.get("domain") as string;
  const currentLevel = Number(formData.get("current_level"));
  const previousLevel = formData.get("previous_level") ? Number(formData.get("previous_level")) : null;
  const teacherNotes = (formData.get("teacher_notes") as string) || null;
  const sessionId = (formData.get("session_id") as string) || null;

  const { error: insertError } = await supabase.from("student_academic_progress_records").insert({
    student_id: studentId,
    domain,
    current_level: currentLevel,
    previous_level: previousLevel,
    growth_summary: computeGrowth(currentLevel, previousLevel),
    teacher_notes: teacherNotes,
    instructional_session_id: sessionId,
    recorded_by: ctx.effectiveUserId,
  });

  if (insertError) return { error: insertError.message };

  const { data: student } = await supabase
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .single();

  const { processCanonicalLearningProgress } = await import("@/lib/instruction/canonical-progress");
  await processCanonicalLearningProgress(supabase, {
    studentId,
    schoolId: student?.school_id,
    actorUserId: ctx.effectiveUserId,
    sessionId,
    evidenceTypeKey: "measurement.progress",
    narrative: teacherNotes ?? `Progress recorded for ${domain}`,
    evidenceConfidence: 0.8,
    evidenceQuality: 0.75,
    sourceContext: { domain, currentLevel, previousLevel },
  });

  await writePlatformAudit(supabase, {
    schoolId: student?.school_id,
    module: "teacher_portal",
    entityType: "students",
    entityId: studentId,
    actionType: "progress_recorded",
    summary: `Progress recorded: ${domain}`,
    actorUserId: ctx.effectiveUserId,
    metadata: { domain, currentLevel, sessionId },
  });

  const levelField =
    domain === "reading" ? "reading_level" : domain === "writing" ? "writing_level" : domain === "math" ? "math_level" : null;

  if (levelField) {
    await supabase
      .from("student_learning_profiles")
      .update({ [levelField]: String(currentLevel) })
      .eq("student_id", studentId);
  }

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function recordStructuredLiteracyAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const studentId = formData.get("student_id") as string;
  const level = Number(formData.get("literacy_level"));
  const step = Number(formData.get("literacy_step"));
  const mastered = formData.get("mastery_recorded") === "true";
  const minutes = Number(formData.get("instructional_minutes") || 0);
  const teacherNotes = (formData.get("teacher_notes") as string) || null;
  const sessionId = (formData.get("session_id") as string) || null;

  const next = recommendNextStructuredLiteracyStep(level, step, mastered);

  const { error: insertError } = await supabase.from("structured_literacy_progress").insert({
    student_id: studentId,
    literacy_level: level,
    literacy_step: step,
    mastery_date: mastered ? new Date().toISOString().split("T")[0] : null,
    instructional_minutes: minutes,
    teacher_notes: teacherNotes,
    next_step_recommendation: next.recommendation,
    instructional_session_id: sessionId,
    recorded_by: ctx.effectiveUserId,
  });

  if (insertError) return { error: insertError.message };

  const { data: student } = await supabase
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .single();

  const { processCanonicalLearningProgress } = await import("@/lib/instruction/canonical-progress");
  const { getPajJourneyByStudent, listPajDomainEnrollments } = await import(
    "@/lib/platform/paj/persistence/records"
  );
  const journey = await getPajJourneyByStudent(supabase, studentId);
  let activeCompetencyKey: string | undefined;
  if (journey) {
    const enrollments = await listPajDomainEnrollments(supabase, journey.id);
    activeCompetencyKey =
      enrollments.find((enrollment) => enrollment.status === "active")?.active_competency_key ?? undefined;
  }

  await processCanonicalLearningProgress(supabase, {
    studentId,
    schoolId: student?.school_id,
    actorUserId: ctx.effectiveUserId,
    sessionId,
    evidenceTypeKey: "assessment.structured_literacy",
    competencyKeys: activeCompetencyKey ? [activeCompetencyKey] : undefined,
    narrative: teacherNotes ?? `Structured literacy L${level} step ${step}${mastered ? " (mastered)" : ""}`,
    evidenceConfidence: mastered ? 0.95 : 0.8,
    evidenceQuality: mastered ? 0.9 : 0.75,
    sourceContext: { literacyLevel: level, literacyStep: step, mastered, instructionalMinutes: minutes },
    educatorConfirmAdvance: mastered,
  });

  if (mastered) {
    await supabase.from("student_academic_progress_records").insert({
      student_id: studentId,
      domain: "structured_literacy",
      current_level: next.level,
      previous_level: level,
      growth_summary: computeGrowth(next.level, level),
      teacher_notes: next.recommendation,
      instructional_session_id: sessionId,
      recorded_by: ctx.effectiveUserId,
    });
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true, recommendation: next.recommendation };
}

export async function saveTeacherNoteAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) return { error: "No employee profile linked" };

  const tagsRaw = (formData.get("tags") as string) || "";
  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

  const { error: insertError } = await supabase.from("teacher_instructional_notes").insert({
    employee_id: employeeId,
    student_id: (formData.get("student_id") as string) || null,
    instructional_session_id: (formData.get("session_id") as string) || null,
    category: formData.get("category") as string,
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    tags,
    created_by: ctx.effectiveUserId,
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function sendParentMessageAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.communicate");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) return { error: "No employee profile linked" };

  const studentId = formData.get("student_id") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const messageType = (formData.get("message_type") as string) || "message";

  const { data: student } = await supabase
    .from("students")
    .select("school_id, family_id")
    .eq("id", studentId)
    .single();

  const { deliverParentCommunication } = await import(
    "@/lib/platform/parent-communication/deliver"
  );
  await deliverParentCommunication(supabase, {
    studentId,
    schoolId: student?.school_id,
    familyId: student?.family_id,
    category: "teacher_message",
    title: subject,
    body,
    channel: "teacher_portal",
    actorUserId: ctx.effectiveUserId,
    href: "/portal/messages",
    relatedEntityType: "teacher_parent_outreach",
    metadata: { messageType },
    fireLoopTransition: true,
    createFollowUpWork: messageType === "intervention",
    followUpTitle: `Intervention follow-up: ${subject}`,
    followUpHref: `/dashboard/students/${studentId}?section=interventions`,
  });

  const { data: outreach } = await supabase
    .from("teacher_parent_outreach")
    .insert({
      employee_id: employeeId,
      student_id: studentId,
      message_type: messageType,
      subject,
      body,
      status: "sent",
      sent_at: new Date().toISOString(),
      created_by: ctx.effectiveUserId,
    })
    .select("id")
    .single();

  await writePlatformAudit(supabase, {
    schoolId: student?.school_id,
    module: "teacher_portal",
    entityType: "students",
    entityId: studentId,
    actionType: "parent_message_sent",
    summary: subject,
    actorUserId: ctx.effectiveUserId,
    metadata: { outreachId: outreach?.id, messageType },
  });

  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function recordSessionAssessmentAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;
  const studentId = formData.get("student_id") as string;
  const title = formData.get("title") as string;
  const score = (formData.get("score") as string) || null;
  const assessmentType = (formData.get("assessment_type") as string) || "quick_check";

  const { data: sisAssessment } = await supabase
    .from("student_academic_assessments")
    .insert({
      student_id: studentId,
      assessment_type: assessmentType === "map" ? "map_reading" : "benchmark",
      assessment_name: title,
      score: score ?? undefined,
      assessed_on: new Date().toISOString().split("T")[0],
      recorded_by: ctx.effectiveUserId,
    })
    .select("id")
    .single();

  await supabase.from("session_assessment_records").insert({
    instructional_session_id: sessionId,
    student_id: studentId,
    assessment_type: assessmentType,
    title,
    score,
    sis_assessment_id: sisAssessment?.id ?? null,
    recorded_by: ctx.effectiveUserId,
  });

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  return { success: true };
}

export async function saveLessonPlanAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) return { error: "No employee profile linked" };

  const { data: emp } = await supabase.from("employees").select("school_id").eq("id", employeeId).single();

  const { error: insertError } = await supabase.from("teacher_lesson_plans").insert({
    employee_id: employeeId,
    school_id: emp?.school_id,
    title: formData.get("title") as string,
    subject_domain: (formData.get("subject_domain") as string) || null,
    objectives: JSON.parse((formData.get("objectives") as string) || "[]"),
    materials: JSON.parse((formData.get("materials") as string) || "[]"),
    activities: JSON.parse((formData.get("activities") as string) || "[]"),
    homework: (formData.get("homework") as string) || null,
    differentiation: (formData.get("differentiation") as string) || null,
    accommodations: (formData.get("accommodations") as string) || null,
    status: "published",
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/teacher");
  return { success: true };
}

export async function registerArtifactAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  const studentId = formData.get("student_id") as string;

  const { data: artifact, error: insertError } = await supabase.from("student_learning_artifacts").insert({
    student_id: studentId,
    instructional_session_id: (formData.get("session_id") as string) || null,
    artifact_type: formData.get("artifact_type") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    storage_path: formData.get("storage_path") as string,
    file_name: (formData.get("file_name") as string) || null,
    learning_objective: (formData.get("learning_objective") as string) || null,
    growth_goal_id: (formData.get("growth_goal_id") as string) || null,
    intervention_id: (formData.get("intervention_id") as string) || null,
    subject_domain: (formData.get("subject_domain") as string) || null,
    recorded_by_employee_id: employeeId,
    visible_to_parent: formData.get("visible_to_parent") === "true",
    uploaded_by: ctx.effectiveUserId,
  }).select("id").single();

  if (insertError) return { error: insertError.message };

  const { data: student } = await supabase.from("students").select("school_id").eq("id", studentId).single();
  const { publishCollaborationFeedEvent } = await import("@/lib/instruction/feed");
  await publishCollaborationFeedEvent(supabase, {
    studentId,
    schoolId: student?.school_id,
    actorUserId: ctx.effectiveUserId,
    actorEmployeeId: employeeId ?? undefined,
    eventType: "artifact_uploaded",
    title: `New evidence: ${formData.get("title")}`,
    relatedEntityType: "student_learning_artifacts",
    relatedEntityId: artifact?.id,
  });

  await writePlatformAudit(supabase, {
    module: "teacher_portal",
    entityType: "student_learning_artifacts",
    entityId: artifact?.id ?? studentId,
    actionType: "artifact_uploaded",
    summary: formData.get("title") as string,
    actorUserId: ctx.effectiveUserId,
    schoolId: student?.school_id,
  });

  const learningObjective = (formData.get("learning_objective") as string) || null;
  const { processCanonicalLearningProgress } = await import("@/lib/instruction/canonical-progress");

  const competencyKeys = learningObjective ? [learningObjective] : [];
  await processCanonicalLearningProgress(supabase, {
    studentId,
    schoolId: student?.school_id,
    actorUserId: ctx.effectiveUserId,
    sessionId: (formData.get("session_id") as string) || null,
    evidenceTypeKey: "artifact.product",
    competencyKeys: competencyKeys.length ? competencyKeys : undefined,
    artifactRefs: artifact?.id
      ? [{ refType: "student_learning_artifacts", refId: artifact.id, label: formData.get("title") as string }]
      : undefined,
    narrative: (formData.get("description") as string) || null,
    evidenceConfidence: 0.85,
    evidenceQuality: 0.8,
    sourceContext: {
      sessionId: (formData.get("session_id") as string) || null,
      artifactType: formData.get("artifact_type") as string,
    },
  });

  revalidatePath("/dashboard/teacher");
  revalidatePath(`/dashboard/teacher/sessions/${formData.get("session_id")}`);
  return { success: true };
}

function parseStandards(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* comma-separated fallback */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function updateSessionStudentRecordAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const sessionId = formData.get("session_id") as string;
  const studentId = formData.get("student_id") as string;

  const { error: upsertError } = await supabase.from("instructional_session_student_records").upsert(
    {
      instructional_session_id: sessionId,
      student_id: studentId,
      participation_level: (formData.get("participation_level") as string) || null,
      behavior_observation: (formData.get("behavior_observation") as string) || null,
      session_notes: (formData.get("student_session_notes") as string) || null,
    },
    { onConflict: "instructional_session_id,student_id" }
  );

  if (upsertError) return { error: upsertError.message };

  const behaviorNote = formData.get("behavior_observation") as string;
  if (behaviorNote?.trim()) {
    await supabase.from("student_behavior_events").insert({
      student_id: studentId,
      event_type: "intervention",
      title: "Session behavior observation",
      description: behaviorNote,
      severity: "normal",
      recorded_by: ctx.effectiveUserId,
    });
  }

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  return { success: true };
}

export async function assignInterventionAction(formData: FormData) {
  const { ctx, error } = await requireTeacherPermission("teacher.manage");
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const supabase = await createAuthClient();
  const employeeId = await getTeacherEmployeeId(supabase, ctx.effectiveUserId);
  if (!employeeId) return { error: "No employee profile linked" };

  const studentId = formData.get("student_id") as string;
  const { error: insertError } = await supabase.from("student_academic_interventions").insert({
    student_id: studentId,
    intervention_type: formData.get("intervention_type") as string,
    intervention_category: (formData.get("intervention_category") as string) || null,
    goal_text: (formData.get("goal_text") as string) || null,
    frequency: (formData.get("frequency") as string) || null,
    duration_weeks: formData.get("duration_weeks") ? Number(formData.get("duration_weeks")) : null,
    review_date: (formData.get("review_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
    assigned_employee_id: employeeId,
    provider_user_id: ctx.effectiveUserId,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  if (insertError) return { error: insertError.message };

  await writePlatformAudit(supabase, {
    module: "teacher_portal",
    entityType: "students",
    entityId: studentId,
    actionType: "intervention_assigned",
    summary: `Intervention: ${formData.get("intervention_type")}`,
    actorUserId: ctx.effectiveUserId,
  });

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath("/dashboard/teacher");
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}
