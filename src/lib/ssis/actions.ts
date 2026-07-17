"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/platform/identity/action-guards";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { transitionStudentLifecycle, type LifecycleStage } from "@/lib/ssis/transitions";
import { logStudentCommunicationEvent } from "@/lib/ssis/timeline";
import { computeStudentSuccessScore } from "@/lib/ssis/score";

async function requireStudentsEdit() {
  return assertPermission("students.edit");
}

async function requireStudentsAttendance() {
  return assertPermission("students.attendance");
}

export async function recordStudentAttendance(formData: FormData) {
  // A.1 — attendance is not a general student edit capability.
  const auth = await requireStudentsAttendance();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const studentId = formData.get("student_id") as string;
  const status = formData.get("status") as string;
  const context = (formData.get("attendance_context") as string) || "daily";
  const date = (formData.get("attendance_date") as string) || new Date().toISOString().split("T")[0];
  const notes = (formData.get("notes") as string) || null;
  const notifyParent = formData.get("notify_parent") === "true";

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("student_attendance_records").upsert(
    {
      student_id: studentId,
      attendance_date: date,
      status,
      attendance_context: context,
      notes,
      parent_notified: notifyParent,
      parent_notified_at: notifyParent ? new Date().toISOString() : null,
      recorded_by: user?.id ?? null,
    },
    { onConflict: "student_id,attendance_date" }
  );

  if (error) return { error: error.message };

  if (notifyParent && status.startsWith("absent")) {
    const { data: student } = await supabase
      .from("students")
      .select("school_id, first_name, last_name, family_id")
      .eq("id", studentId)
      .single();
    const { deliverParentCommunication } = await import(
      "@/lib/platform/parent-communication/deliver"
    );
    await deliverParentCommunication(supabase, {
      studentId,
      schoolId: student?.school_id,
      familyId: student?.family_id,
      category: "attendance",
      title: `Attendance: ${status.replace(/_/g, " ")}`,
      body: notes ?? `Recorded for ${date}`,
      channel: "parent_portal",
      actorUserId: user?.id ?? null,
      href: "/portal",
      metadata: { attendanceDate: date, status },
      createFollowUpWork: true,
      followUpHref: `/dashboard/students/${studentId}?section=attendance`,
    });
  } else {
    await logStudentCommunicationEvent(supabase, {
      studentId,
      channel: "attendance",
      direction: "internal",
      subject: `Attendance: ${status.replace(/_/g, " ")}`,
      body: notes ?? `Recorded for ${date}`,
      actorUserId: user?.id ?? null,
    });
  }

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export async function recordBehaviorEvent(formData: FormData) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const studentId = formData.get("student_id") as string;
  const eventType = formData.get("event_type") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("student_behavior_events").insert({
    student_id: studentId,
    event_type: eventType,
    title,
    description,
    recorded_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  await logStudentCommunicationEvent(supabase, {
    studentId,
    channel: "behavior",
    direction: "internal",
    subject: title,
    body: description ?? eventType,
    actorUserId: user?.id ?? null,
  });

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export async function transitionStudentStage(formData: FormData) {
  const auth = await assertPermission("students.edit");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const studentId = formData.get("student_id") as string;
  const toStage = formData.get("to_stage") as LifecycleStage;
  const notes = (formData.get("notes") as string) || undefined;

  const { data: { user } } = await supabase.auth.getUser();

  const result = await transitionStudentLifecycle(supabase, {
    studentId,
    toStage,
    triggerSource: "manual",
    triggeredBy: user?.id ?? null,
    notes,
  });

  if (!result.success) return { error: result.error };
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}

export async function refreshStudentSuccessScore(studentId: string) {
  const auth = await requireStudentsEdit();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  await computeStudentSuccessScore(supabase, studentId);
  revalidatePath(`/dashboard/students/${studentId}`);
  return { success: true };
}
