import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordHcmActivity } from "./activity";
import { sendHcmCommunication } from "./communications";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function listExpiringCertifications(
  supabase: AuthClient,
  options?: { schoolId?: string | null; withinDays?: number }
) {
  const withinDays = options?.withinDays ?? 90;
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + withinDays);
  const horizonIso = horizon.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  let request = supabase
    .from("employee_certifications")
    .select(
      "*, employees!inner(id, school_id, employment_status), employee_profiles(first_name, last_name)"
    )
    .not("expiration_date", "is", null)
    .gte("expiration_date", today)
    .lte("expiration_date", horizonIso)
    .order("expiration_date");

  if (options?.schoolId) {
    request = request.eq("employees.school_id", options.schoolId);
  }

  const { data, error } = await request;
  if (error) {
    // Fallback without join aliases
    const { data: fallback } = await supabase
      .from("employee_certifications")
      .select("*")
      .not("expiration_date", "is", null)
      .gte("expiration_date", today)
      .lte("expiration_date", horizonIso)
      .order("expiration_date");
    return fallback ?? [];
  }
  return data ?? [];
}

export async function emitCertificationExpiringAlerts(
  supabase: AuthClient,
  options?: { schoolId?: string | null; withinDays?: number }
): Promise<number> {
  const rows = await listExpiringCertifications(supabase, options);
  let count = 0;
  const actorUserId = await resolveActorUserId(supabase);

  for (const row of rows) {
    if (row.reminder_sent_at) continue;
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const schoolId = (emp as { school_id?: string } | null)?.school_id ?? options?.schoolId;
    const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

    await recordHcmActivity(supabase, {
      eventType: "employee.certification.expiring",
      title: "Certification expiring",
      summary: `${row.certification_name ?? row.name ?? "Credential"} · ${row.expiration_date}`,
      entityId: row.employee_id,
      organizationId: schoolCtx?.organizationId,
      schoolId,
      actorUserId,
      sourceTable: "employee_certifications",
      sourceId: row.id,
      payload: {
        certificationId: row.id,
        expirationDate: row.expiration_date,
      },
    });

    await sendHcmCommunication(supabase, {
      kind: "certification_alert",
      organizationId: schoolCtx?.organizationId,
      schoolId,
      body: `A certification is expiring on ${row.expiration_date}.`,
      actorUserId,
    });

    await supabase
      .from("employee_certifications")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", row.id);
    count += 1;
  }
  return count;
}
