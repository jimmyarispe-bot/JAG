import type { createAuthClient } from "@/lib/supabase/server-auth";
import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { registerComplianceObligationsBatch } from "@/lib/compliance/registry";
import type { RegisterObligationInput } from "@/lib/compliance/types";
import { logComplianceAudit } from "@/lib/compliance/audit";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const today = () => new Date().toISOString().split("T")[0];

/** Sync deadlines from existing modules into the compliance engine (no duplicate reminders elsewhere) */
export async function syncModuleDeadlinesToCompliance(supabase: AuthClient) {
  const { syncUniversalDeadlines } = await import("@/lib/compliance/sync-deadlines");
  await Promise.all([
    syncUniversalDeadlines(supabase),
    syncHrCertificationDeadlines(supabase),
    syncExecutiveComplianceRequirements(supabase),
    syncSpedReviewDeadlines(supabase),
  ]);
}

async function syncHrCertificationDeadlines(supabase: AuthClient) {
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
  const { data: certs } = await supabase
    .from("employee_certifications")
    .select("id, certification_name, expiration_date, certification_type, employee_id, employees(school_id, user_id)")
    .eq("status", "active")
    .not("expiration_date", "is", null)
    .lte("expiration_date", in90);

  const inputs: RegisterObligationInput[] = (certs ?? []).map((cert) => {
    const emp = Array.isArray(cert.employees) ? cert.employees[0] : cert.employees;
    return {
      schoolId: (emp as { school_id?: string })?.school_id,
      categoryKey: mapCertTypeToCategory(String(cert.certification_type ?? "other")),
      title: `Renew: ${cert.certification_name}`,
      description: `Employee certification expires ${cert.expiration_date}`,
      dueDate: cert.expiration_date!,
      frequency: "annual",
      riskLevel: cert.expiration_date! <= today() ? "critical" : "high",
      priority: "high",
      ownerUserId: (emp as { user_id?: string })?.user_id ?? null,
      sourceModule: "hr",
      sourceEntityType: "employee_certifications",
      sourceEntityId: cert.id,
    };
  });

  await registerComplianceObligationsBatch(supabase, inputs);
}

async function syncExecutiveComplianceRequirements(supabase: AuthClient) {
  const { data: reqs } = await supabase
    .from("executive_compliance_requirements")
    .select("*")
    .in("status", ["pending", "in_progress", "overdue"]);

  const inputs: RegisterObligationInput[] = (reqs ?? []).map((req) => ({
    schoolId: req.school_id,
    categoryKey: mapRequirementTypeToCategory(req.requirement_type),
    title: req.title,
    description: req.description,
    dueDate: req.due_date ?? req.renewal_date ?? today(),
    ownerUserId: req.owner_user_id,
    sourceModule: "executive",
    sourceEntityType: "executive_compliance_requirements",
    sourceEntityId: req.id,
    riskLevel: req.status === "overdue" ? "critical" : "medium",
  }));

  await registerComplianceObligationsBatch(supabase, inputs);
}

async function syncSpedReviewDeadlines(supabase: AuthClient) {
  const horizon = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
  const { data: plans } = await supabase
    .from("student_special_education_plans")
    .select("id, student_id, plan_type, annual_review_date, reevaluation_date, students(school_id, first_name, last_name)")
    .eq("status", "active");

  const inputs: RegisterObligationInput[] = [];
  for (const plan of plans ?? []) {
    const st = Array.isArray(plan.students) ? plan.students[0] : plan.students;
    const reviewDate = plan.annual_review_date ?? plan.reevaluation_date;
    if (!reviewDate || reviewDate > horizon) continue;

    inputs.push({
      schoolId: (st as { school_id?: string })?.school_id,
      categoryKey: plan.plan_type === "504" ? "student_504" : "student_iep",
      title: `${plan.plan_type === "504" ? "504" : "IEP"} Review: ${(st as { first_name?: string })?.first_name ?? "Student"}`,
      dueDate: reviewDate,
      frequency: "annual",
      sourceModule: "sis",
      sourceEntityType: "student_special_education_plans",
      sourceEntityId: plan.id,
      riskLevel: "high",
    });
  }

  await registerComplianceObligationsBatch(supabase, inputs);
}

function mapCertTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    teaching_license: "hr_teaching_license",
    therapy_license: "hr_therapy_license",
    cpr: "hr_cpr",
    first_aid: "hr_first_aid",
    background_check: "hr_background_check",
    fingerprint: "hr_fingerprinting",
  };
  return map[type] ?? "hr_mandatory_training";
}

function mapRequirementTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    accreditation: "accreditation",
    state_approval: "licensing_state",
    special_education: "student_iep",
    financial_audit: "finance_audit",
    hr_compliance: "hr_mandatory_training",
    safety: "facilities_security",
  };
  return map[type] ?? "governance";
}

export async function processComplianceRemindersAndEscalations(supabase: AuthClient) {
  const t = today();

  await supabase
    .from("compliance_obligations")
    .update({ status: "overdue" })
    .eq("status", "pending")
    .lt("due_date", t);

  const { data: schedules } = await supabase
    .from("compliance_reminder_schedules")
    .select("*")
    .eq("is_active", true);

  const defaultSchedule = schedules?.find((s) => s.is_default) ?? schedules?.[0];
  const daysBefore: number[] = defaultSchedule?.days_before ?? [30, 14, 7, 3, 1, 0];

  const [{ data: pending }, { data: escalationRules }] = await Promise.all([
    supabase.from("compliance_obligations").select("*").in("status", ["pending", "overdue", "in_review"]),
    supabase.from("compliance_escalation_rules").select("*").eq("is_active", true),
  ]);

  const obligationIds = (pending ?? []).map((o) => o.id);
  const reminderDate = t;

  const [{ data: existingReminders }, { data: existingEscalations }] = await Promise.all([
    obligationIds.length
      ? supabase
          .from("compliance_obligation_reminders")
          .select("obligation_id, days_before")
          .eq("reminder_date", reminderDate)
          .in("obligation_id", obligationIds)
      : Promise.resolve({ data: [] as Array<{ obligation_id: string; days_before: number }> }),
    obligationIds.length
      ? supabase
          .from("compliance_obligation_escalations")
          .select("obligation_id, days_overdue")
          .in("obligation_id", obligationIds)
      : Promise.resolve({ data: [] as Array<{ obligation_id: string; days_overdue: number }> }),
  ]);

  const reminderKeys = new Set(
    (existingReminders ?? []).map((r) => `${r.obligation_id}|${r.days_before}`)
  );
  const escalationKeys = new Set(
    (existingEscalations ?? []).map((e) => `${e.obligation_id}|${e.days_overdue}`)
  );

  const sortedRules = [...(escalationRules ?? [])].sort(
    (a, b) => Number(b.days_overdue) - Number(a.days_overdue)
  );

  for (const ob of pending ?? []) {
    const due = new Date(ob.due_date);
    const now = new Date(t);
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    const daysOverdue = daysUntil < 0 ? Math.abs(daysUntil) : 0;

    for (const days of daysBefore) {
      if (daysUntil === days || (days === 0 && daysUntil === 0)) {
        await sendComplianceReminder(supabase, ob, days, false, reminderKeys);
      }
    }

    if (daysOverdue > 0 && defaultSchedule?.notify_daily_when_overdue) {
      await sendComplianceReminder(supabase, ob, -daysOverdue, true, reminderKeys);
    }

    await processEscalations(supabase, ob, daysOverdue, sortedRules, escalationKeys);
    await syncMissionControlForObligation(supabase, ob, daysUntil, daysOverdue);
  }

  await upsertDomainScores(supabase);
}

async function sendComplianceReminder(
  supabase: AuthClient,
  ob: Record<string, unknown>,
  daysBefore: number,
  isOverdueDaily = false,
  reminderKeys?: Set<string>
) {
  const reminderDate = today();
  const key = `${ob.id as string}|${daysBefore}`;
  if (reminderKeys?.has(key)) return;

  if (!reminderKeys) {
    const { data: existing } = await supabase
      .from("compliance_obligation_reminders")
      .select("id")
      .eq("obligation_id", ob.id as string)
      .eq("reminder_date", reminderDate)
      .eq("days_before", daysBefore)
      .maybeSingle();
    if (existing) return;
  }

  reminderKeys?.add(key);

  await supabase.from("compliance_obligation_reminders").insert({
    obligation_id: ob.id as string,
    days_before: daysBefore,
    reminder_date: reminderDate,
    channel: "mission_control",
    recipient_user_id: ob.owner_user_id as string | null,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  const title = isOverdueDaily
    ? `OVERDUE (${Math.abs(daysBefore)}d): ${ob.title}`
    : daysBefore === 0
      ? `Due today: ${ob.title}`
      : `Due in ${daysBefore} days: ${ob.title}`;

  await createMissionControlItem(supabase, {
    schoolId: ob.school_id as string | null,
    module:
      ob.assignee_type === "parent"
        ? "parent_portal"
        : ob.assignee_type === "student"
          ? "sis"
          : ob.assignee_type === "teacher"
            ? "teacher_portal"
            : "compliance",
    itemType: "compliance_alert",
    title,
    body: String(ob.description ?? ob.title),
    href: (ob.action_href as string | null) ?? `/dashboard/compliance?view=obligations`,
    entityType: "compliance_obligations",
    entityId: ob.id as string,
    assignedUserId: (ob.guardian_user_id as string | null) ?? (ob.owner_user_id as string | null),
    assignedRole: ob.owner_user_id ? undefined : ob.assignee_type === "teacher" ? "TEACHER" : "HR",
    severity: ob.risk_level === "critical" || isOverdueDaily ? "critical" : daysBefore <= 7 ? "high" : "normal",
  });
}

async function processEscalations(
  supabase: AuthClient,
  ob: Record<string, unknown>,
  daysOverdue: number,
  preloadedRules?: Array<Record<string, unknown>>,
  escalationKeys?: Set<string>
) {
  if (daysOverdue <= 0) return;

  let rule: Record<string, unknown> | undefined;
  if (preloadedRules) {
    rule = preloadedRules.find((r) => Number(r.days_overdue) <= daysOverdue);
  } else {
    const { data: rules } = await supabase
      .from("compliance_escalation_rules")
      .select("*")
      .eq("is_active", true)
      .lte("days_overdue", daysOverdue)
      .order("days_overdue", { ascending: false })
      .limit(1);
    rule = rules?.[0];
  }

  if (!rule) return;

  const escKey = `${ob.id as string}|${rule.days_overdue}`;
  if (escalationKeys?.has(escKey)) return;

  if (!escalationKeys) {
    const { data: existing } = await supabase
      .from("compliance_obligation_escalations")
      .select("id")
      .eq("obligation_id", ob.id as string)
      .eq("days_overdue", rule.days_overdue as number)
      .maybeSingle();
    if (existing) return;
  }

  escalationKeys?.add(escKey);

  await supabase.from("compliance_obligation_escalations").insert({
    obligation_id: ob.id as string,
    days_overdue: rule.days_overdue,
    escalated_to_role: rule.escalate_to_role,
  });

  await createMissionControlItem(supabase, {
    schoolId: ob.school_id as string | null,
    module: "executive",
    itemType: "escalation",
    title: `Escalation: ${ob.title}`,
    body: `${daysOverdue} days overdue — escalated to ${rule.escalate_to_role}`,
    href: `/dashboard/compliance?view=overdue`,
    entityType: "compliance_obligations",
    entityId: ob.id as string,
    assignedRole: rule.escalate_to_role as string,
    severity: rule.severity === "critical" ? "critical" : "high",
  });

  await logComplianceAudit(supabase, {
    obligationId: ob.id as string,
    schoolId: ob.school_id as string | null,
    actionType: "escalated",
    summary: `Escalated to ${rule.escalate_to_role} at ${daysOverdue} days overdue`,
  });
}

async function syncMissionControlForObligation(
  supabase: AuthClient,
  ob: Record<string, unknown>,
  daysUntil: number,
  daysOverdue: number
) {
  if (ob.risk_level !== "critical" && daysOverdue <= 0 && daysUntil > 30) return;

  const { data: docs } = await supabase
    .from("compliance_obligation_documents")
    .select("id")
    .eq("obligation_id", ob.id as string)
    .eq("is_required", true);

  const { data: requiredTypes } = await supabase
    .from("compliance_obligation_templates")
    .select("required_document_types")
    .eq("id", ob.template_id as string)
    .maybeSingle();

  const needsDocs = (requiredTypes?.required_document_types?.length ?? 0) > 0 && !(docs?.length);
  if (needsDocs && daysUntil <= 14) {
    await createMissionControlItem(supabase, {
      schoolId: ob.school_id as string | null,
      module: "executive",
      itemType: "executive_alert",
      title: `Missing documentation: ${ob.title}`,
      body: "Required documents not uploaded",
      href: `/dashboard/compliance?view=documents`,
      entityType: "compliance_obligations",
      entityId: ob.id as string,
      severity: "high",
    });
  }
}

async function upsertDomainScores(supabase: AuthClient) {
  const { data: schools } = await supabase.from("schools").select("id");
  for (const school of schools ?? []) {
    const { data: obligations } = await supabase
      .from("compliance_obligations")
      .select("status, due_date, compliance_categories(domain)")
      .eq("school_id", school.id)
      .not("status", "in", '("archived","cancelled","waived")');

    const byDomain: Record<string, { total: number; completed: number; overdue: number }> = {};
    const t = today();
    for (const ob of obligations ?? []) {
      const cat = ob.compliance_categories as { domain?: string } | null;
      const domain = cat?.domain ?? "general";
      if (!byDomain[domain]) byDomain[domain] = { total: 0, completed: 0, overdue: 0 };
      byDomain[domain].total++;
      if (ob.status === "completed") byDomain[domain].completed++;
      if (ob.status === "overdue" || (ob.status === "pending" && ob.due_date < t)) byDomain[domain].overdue++;
    }

    for (const [domain, stats] of Object.entries(byDomain)) {
      const score_pct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 100;
      const status_indicator = score_pct >= 90 && stats.overdue === 0 ? "green" : score_pct >= 70 ? "yellow" : "red";
      await supabase.from("compliance_domain_scores").upsert(
        {
          school_id: school.id,
          score_date: t,
          domain,
          score_pct,
          status_indicator,
          total_obligations: stats.total,
          completed_obligations: stats.completed,
          overdue_obligations: stats.overdue,
        },
        { onConflict: "school_id,score_date,domain" }
      );
    }
  }
}

export async function syncComplianceToMissionControl(supabase: AuthClient) {
  await syncModuleDeadlinesToCompliance(supabase);
  await processComplianceRemindersAndEscalations(supabase);
}
