import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Notify guardians when attendance marked absent/tardy and not yet notified */
export async function processAttendanceParentNotifications(supabase: AuthClient) {
  const today = new Date().toISOString().split("T")[0];

  const { data: records } = await supabase
    .from("student_attendance_records")
    .select("id, student_id, status, attendance_date, notes, students(first_name, last_name, school_id, family_id, families(billing_email))")
    .eq("attendance_date", today)
    .eq("parent_notified", false)
    .in("status", ["absent_excused", "absent_unexcused", "tardy", "early_dismissal"]);

  for (const record of records ?? []) {
    const studentRaw = record.students;
    const student = Array.isArray(studentRaw) ? studentRaw[0] : studentRaw;
    if (!student) continue;

    const families = student.families as { billing_email?: string } | { billing_email?: string }[] | null;
    const family = Array.isArray(families) ? families[0] : families;
    const email = family?.billing_email;

    const statusLabel = record.status.replace(/_/g, " ");
    const { deliverParentCommunication } = await import(
      "@/lib/platform/parent-communication/deliver"
    );
    await deliverParentCommunication(supabase, {
      studentId: record.student_id,
      schoolId: student.school_id as string,
      familyId: student.family_id as string | null,
      category: "attendance",
      title: `Attendance notice: ${student.first_name} ${student.last_name}`,
      body: `${statusLabel} on ${record.attendance_date}.${record.notes ? ` ${record.notes}` : ""}`,
      channel: email ? "email" : "parent_portal",
      href: "/portal",
      relatedEntityType: "student_attendance_records",
      relatedEntityId: record.id,
      metadata: { attendance_record_id: record.id, billingEmail: email ?? null },
      createFollowUpWork: record.status.startsWith("absent"),
      followUpTitle: `Follow up on ${student.first_name}'s attendance`,
      followUpHref: `/dashboard/students/${record.student_id}?section=attendance`,
    });

    await supabase
      .from("student_attendance_records")
      .update({ parent_notified: true, parent_notified_at: new Date().toISOString() })
      .eq("id", record.id);
  }
}
