import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";
import { sendHcmCommunication } from "./communications";
import { transitionEmployeeLifecycle } from "./lifecycle";
import type { LeaveType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type LeaveResult =
  | { ok: true; leaveId: string; status: string }
  | { ok: false; error: string };

export async function submitLeaveRequest(
  supabase: AuthClient,
  input: {
    employeeId: string;
    schoolId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    hoursRequested?: number;
    reason?: string;
  }
): Promise<LeaveResult> {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: input.employeeId,
      school_id: input.schoolId,
      leave_type: input.leaveType,
      start_date: input.startDate,
      end_date: input.endDate,
      hours_requested: input.hoursRequested ?? null,
      reason: input.reason ?? null,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, leaveId: data.id, status: data.status };
}

export async function decideLeaveRequest(
  supabase: AuthClient,
  input: {
    leaveId: string;
    decision: "approved" | "denied";
    setLeaveOfAbsence?: boolean;
  }
): Promise<LeaveResult> {
  const { data: leave } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", input.leaveId)
    .maybeSingle();
  if (!leave) return { ok: false, error: "Leave request not found" };

  const actorUserId = await resolveActorUserId(supabase);
  await supabase
    .from("leave_requests")
    .update({
      status: input.decision,
      approved_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.leaveId);

  const schoolCtx = await resolveSchoolContext(supabase, leave.school_id);

  if (input.decision === "approved") {
    await recordHcmActivity(supabase, {
      eventType: "employee.leave.approved",
      title: "Leave approved",
      summary: `${leave.leave_type} ${leave.start_date}–${leave.end_date}`,
      entityId: leave.employee_id,
      organizationId: schoolCtx?.organizationId,
      schoolId: leave.school_id,
      actorUserId,
      sourceTable: "leave_requests",
      sourceId: leave.id,
    });

    if (
      input.setLeaveOfAbsence !== false &&
      ["fmla", "unpaid", "vacation", "pto"].includes(String(leave.leave_type))
    ) {
      const days =
        (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) /
        86400000;
      if (days >= 5) {
        await transitionEmployeeLifecycle(supabase, {
          employeeId: leave.employee_id,
          toState: "leave_of_absence",
          title: "Leave of absence",
          schoolId: leave.school_id,
        });
      }
    }
  }

  await sendHcmCommunication(supabase, {
    kind: "time_off_decision",
    organizationId: schoolCtx?.organizationId,
    schoolId: leave.school_id,
    body: `Your ${leave.leave_type} request was ${input.decision}.`,
    actorUserId,
  });

  return { ok: true, leaveId: leave.id, status: input.decision };
}
