import { HS_SCHOOL_ID, placementFromLead, readFamilyAsk, type FamilyAsk, type Placement } from "@/lib/admissions/placement";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * EVERYTHING FINALIZING CONTRACT SHOWS ABOUT ONE CHILD, READ IN ONE PLACE.
 *
 * A child is in Finalizing Contract while their lead is `accepted`, and on
 * Enrolled Students once it is `enrolled`. The rest hangs off the student
 * record the lead becomes (students.admissions_lead_id): the tuition plan, its
 * instalments, the scholarships, and the enrollment packet the parent signs.
 *
 * Nothing here decides anything. It reads, and says plainly what is missing.
 */

export interface FinalizingInstalment {
  id: string;
  sequence: number;
  label: string | null;
  dueDate: string | null;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  /** The Square invoice emailed for it (migration 575). */
  squareInvoiceId: string | null;
  squareInvoiceNumber: string | null;
  squareInvoiceError: string | null;
}

export interface FinalizingAward {
  id: string;
  programName: string;
  programCode: string | null;
  awardYear: string;
  status: string;
  awardedAmount: number | null;
  expectedAmount: number | null;
  /** GSNS: the letter's full-year total, the share, and the deadline for it. */
  totalAwardAmount: number | null;
  awardPercent: number | null;
  awardPercentDeadline: string | null;
  stateStudentNumber: string | null;
}

export interface FinalizingStateInvoice {
  id: string;
  awardId: string;
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  status: string;
  lastError: string | null;
  squareInvoiceId: string | null;
  squareInvoiceNumber: string | null;
  receiptId: string | null;
  squareMarkedPaidAt: string | null;
}

export interface FinalizingPlan {
  id: string;
  lifecycle: string;
  awaitingReason: string | null;
  billingMode: string;
  annualTuition: number | null;
  remainingDue: number | null;
  monthlyAmount: number | null;
  instalments: FinalizingInstalment[];
}

export interface FinalizingChild {
  leadId: string;
  leadStage: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  schoolName: string;
  grade: string | null;
  guardianName: string;
  guardianEmail: string | null;
  stageEnteredAt: string | null;
  /** What the family told us on the inquiry form about state funding. */
  statedFunding: {
    programCode: string | null;
    awardAmount: number | null;
    awardId: string | null;
  };
  studentId: string | null;
  plan: FinalizingPlan | null;
  awards: FinalizingAward[];
  /** One Square invoice per state scholarship payment (migration 573). */
  stateInvoices: FinalizingStateInvoice[];
  packetStatus: string | null;
  /** When the parent signed the contract, if they have. */
  contractSignedAt: string | null;
  /** What the parent asked for: preferred start, and at HS the classes. */
  familyAsk: FamilyAsk;
  /** HS: what the school leader chose at Accept (migration 574). */
  placement: Placement;
  isHs: boolean;
  /** The first instalment that asks the family for money, if any. */
  firstPayable: FinalizingInstalment | null;
  /** Everything Jimmy can edit on Finalizing Contract, as stored. */
  details: {
    firstName: string;
    lastName: string;
    preferredName: string | null;
    dateOfBirth: string | null;
    applyingForGrade: string | null;
    guardianFirstName: string | null;
    guardianLastName: string | null;
    guardianEmail: string | null;
    guardianPhone: string | null;
    parent2: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  };
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/** The first instalment with something to pay. Months listed at 0.00 are not it. */
export function firstPayableInstalment(
  instalments: readonly FinalizingInstalment[]
): FinalizingInstalment | null {
  return (
    [...instalments]
      .sort((a, b) => a.sequence - b.sequence)
      .find((i) => i.amount > 0) ?? null
  );
}

export async function loadFinalizingChildren(
  supabase: AuthClient,
  stages: readonly ("accepted" | "enrolled")[],
  options: {
    /**
     * False on Enrolled Students. School leaders open that page and must not
     * be shown tuition - and row-level security may refuse them the plan
     * tables, which would otherwise fail the whole page.
     */
    withMoney?: boolean;
  } = {}
): Promise<{ children: FinalizingChild[]; error?: string }> {
  const withMoney = options.withMoney ?? true;
  const { data: leads, error: leadsError } = await supabase
    .from("admissions_leads")
    .select(
      "id, lead_stage, first_name, last_name, preferred_name, date_of_birth, school_id, applying_for_grade, current_grade, guardian_first_name, guardian_last_name, guardian_email, guardian_phone, stage_entered_at, state_funding_program_code, state_funding_award_amount, state_funding_award_id, placement_class_names, placement_sl_tutoring_days, placement_math_tutoring_days, actual_start_date, placement_recorded_at, schools(name)"
    )
    .in("lead_stage", stages as string[])
    .is("archived_at", null)
    .order("stage_entered_at", { ascending: true });

  if (leadsError) return { children: [], error: leadsError.message };
  const leadRows = (leads ?? []) as Record<string, unknown>[];
  if (leadRows.length === 0) return { children: [] };

  const leadIds = leadRows.map((l) => String(l.id));

  const [studentsResult, packetsResult] = withMoney
    ? await Promise.all([
        supabase.from("students").select("id, admissions_lead_id").in("admissions_lead_id", leadIds),
        supabase
          .from("enrollment_packets")
          .select("lead_id, packet_status, generated_at, signed_contract_at, completed_at")
          .in("lead_id", leadIds)
          .order("generated_at", { ascending: false }),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (studentsResult.error) return { children: [], error: studentsResult.error.message };

  const studentByLead = new Map<string, string>();
  for (const s of studentsResult.data ?? []) {
    if (s.admissions_lead_id && !studentByLead.has(String(s.admissions_lead_id))) {
      studentByLead.set(String(s.admissions_lead_id), String(s.id));
    }
  }

  /* The second parent, if the family gave one: a non-primary guardian row. */
  const parent2ByLead = new Map<string, FinalizingChild["details"]["parent2"]>();
  if (withMoney) {
    const { data: g } = await supabase
      .from("admissions_lead_guardians")
      .select("id, lead_id, first_name, last_name, email, phone, primary_guardian")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: true });
    for (const row of (g ?? []) as Record<string, unknown>[]) {
      if (row.primary_guardian) continue;
      const lead = String(row.lead_id);
      if (parent2ByLead.has(lead)) continue;
      parent2ByLead.set(lead, {
        id: String(row.id),
        firstName: String(row.first_name ?? ""),
        lastName: String(row.last_name ?? ""),
        email: str(row.email),
        phone: str(row.phone),
      });
    }
  }

  const packetByLead = new Map<string, string>();
  const signedAtByLead = new Map<string, string | null>();
  for (const p of (packetsResult.data ?? []) as Record<string, unknown>[]) {
    const lead = String(p.lead_id);
    if (!packetByLead.has(lead)) {
      packetByLead.set(lead, String(p.packet_status));
      signedAtByLead.set(lead, str(p.signed_contract_at) ?? str(p.completed_at));
    }
  }

  const studentIds = [...studentByLead.values()];
  const plansByStudent = new Map<string, FinalizingPlan>();
  const awardsByStudent = new Map<string, FinalizingAward[]>();
  const invoicesByStudent = new Map<string, FinalizingStateInvoice[]>();

  if (studentIds.length > 0) {
    const [plansResult, awardsResult] = await Promise.all([
      supabase
        .from("student_tuition_plans")
        .select(
          "id, student_id, lifecycle, awaiting_reason, billing_mode, annual_tuition, remaining_due, monthly_amount, status, created_at"
        )
        .in("student_id", studentIds)
        .not("status", "in", "(superseded,cancelled)")
        .order("created_at", { ascending: false }),
      supabase
        .from("scholarship_awards")
        .select(
          "id, student_id, program_name, program_code, award_year, status, awarded_amount, expected_amount, total_award_amount, award_percent, award_percent_deadline, state_student_number"
        )
        .in("student_id", studentIds)
        .order("created_at", { ascending: true }),
    ]);

    if (plansResult.error) return { children: [], error: plansResult.error.message };
    if (awardsResult.error) return { children: [], error: awardsResult.error.message };

    const { data: invRows, error: invError } = await supabase
      .from("scholarship_invoices" as never)
      .select(
        "id, award_id, student_id, sequence, label, due_date, amount, status, last_error, square_invoice_id, square_invoice_number, receipt_id, square_marked_paid_at"
      )
      .in("student_id", studentIds)
      .neq("status", "cancelled")
      .order("due_date", { ascending: true });
    if (invError) return { children: [], error: invError.message };
    for (const r of (invRows ?? []) as Record<string, unknown>[]) {
      const sid = String(r.student_id);
      const list = invoicesByStudent.get(sid) ?? [];
      list.push({
        id: String(r.id),
        awardId: String(r.award_id),
        sequence: Number(r.sequence),
        label: String(r.label),
        dueDate: String(r.due_date),
        amount: num(r.amount) ?? 0,
        status: String(r.status),
        lastError: str(r.last_error),
        squareInvoiceId: str(r.square_invoice_id),
        squareInvoiceNumber: str(r.square_invoice_number),
        receiptId: str(r.receipt_id),
        squareMarkedPaidAt: str(r.square_marked_paid_at),
      });
      invoicesByStudent.set(sid, list);
    }

    const latestPlanRow = new Map<string, Record<string, unknown>>();
    for (const p of (plansResult.data ?? []) as Record<string, unknown>[]) {
      const sid = String(p.student_id);
      if (!latestPlanRow.has(sid)) latestPlanRow.set(sid, p);
    }

    const planIds = [...latestPlanRow.values()].map((p) => String(p.id));
    const instalmentsByPlan = new Map<string, FinalizingInstalment[]>();
    if (planIds.length > 0) {
      const { data: inst, error: instError } = await supabase
        .from("student_tuition_instalments")
        .select(
          "id, plan_id, sequence, label, due_date, amount, is_paid, paid_at, paid_amount, payment_method, payment_reference, square_invoice_id, square_invoice_number, square_invoice_error"
        )
        .in("plan_id", planIds)
        .order("sequence", { ascending: true });
      if (instError) return { children: [], error: instError.message };
      for (const i of (inst ?? []) as Record<string, unknown>[]) {
        const pid = String(i.plan_id);
        const list = instalmentsByPlan.get(pid) ?? [];
        list.push({
          id: String(i.id),
          sequence: Number(i.sequence),
          label: str(i.label),
          dueDate: str(i.due_date),
          amount: num(i.amount) ?? 0,
          isPaid: Boolean(i.is_paid),
          paidAt: str(i.paid_at),
          paidAmount: num(i.paid_amount),
          paymentMethod: str(i.payment_method),
          paymentReference: str(i.payment_reference),
          squareInvoiceId: str(i.square_invoice_id),
          squareInvoiceNumber: str(i.square_invoice_number),
          squareInvoiceError: str(i.square_invoice_error),
        });
        instalmentsByPlan.set(pid, list);
      }
    }

    for (const [sid, p] of latestPlanRow) {
      plansByStudent.set(sid, {
        id: String(p.id),
        lifecycle: String(p.lifecycle),
        awaitingReason: str(p.awaiting_reason),
        billingMode: String(p.billing_mode),
        annualTuition: num(p.annual_tuition),
        remainingDue: num(p.remaining_due),
        monthlyAmount: num(p.monthly_amount),
        instalments: instalmentsByPlan.get(String(p.id)) ?? [],
      });
    }

    for (const a of (awardsResult.data ?? []) as Record<string, unknown>[]) {
      const sid = String(a.student_id);
      const list = awardsByStudent.get(sid) ?? [];
      list.push({
        id: String(a.id),
        programName: String(a.program_name),
        programCode: str(a.program_code),
        awardYear: String(a.award_year),
        status: String(a.status),
        awardedAmount: num(a.awarded_amount),
        expectedAmount: num(a.expected_amount),
        totalAwardAmount: num(a.total_award_amount),
        awardPercent: num(a.award_percent),
        awardPercentDeadline: str(a.award_percent_deadline),
        stateStudentNumber: str(a.state_student_number),
      });
      awardsByStudent.set(sid, list);
    }
  }

  const askByLead = new Map<string, FamilyAsk>();
  await Promise.all(
    leadRows.map(async (l) => {
      askByLead.set(String(l.id), await readFamilyAsk(supabase as never, String(l.id)));
    })
  );

  const children: FinalizingChild[] = leadRows.map((l) => {
    const leadId = String(l.id);
    const studentId = studentByLead.get(leadId) ?? null;
    const plan = studentId ? plansByStudent.get(studentId) ?? null : null;
    const schools = l.schools as { name?: string } | { name?: string }[] | null;
    const schoolName = (Array.isArray(schools) ? schools[0]?.name : schools?.name) ?? "—";
    return {
      leadId,
      leadStage: String(l.lead_stage),
      firstName: String(l.first_name ?? ""),
      lastName: String(l.last_name ?? ""),
      schoolId: String(l.school_id),
      schoolName,
      grade: str(l.applying_for_grade) ?? str(l.current_grade),
      guardianName: `${l.guardian_first_name ?? ""} ${l.guardian_last_name ?? ""}`.trim(),
      guardianEmail: str(l.guardian_email),
      stageEnteredAt: str(l.stage_entered_at),
      statedFunding: {
        programCode: str(l.state_funding_program_code),
        awardAmount: num(l.state_funding_award_amount),
        awardId: str(l.state_funding_award_id),
      },
      studentId,
      plan,
      awards: studentId ? awardsByStudent.get(studentId) ?? [] : [],
      stateInvoices: studentId ? invoicesByStudent.get(studentId) ?? [] : [],
      packetStatus: packetByLead.get(leadId) ?? null,
      contractSignedAt: signedAtByLead.get(leadId) ?? null,
      familyAsk: askByLead.get(leadId) ?? { preferredStart: null, options: [], slTutoringDays: null, mathTutoringDays: null },
      placement: placementFromLead(l as Record<string, unknown>),
      isHs: String(l.school_id) === HS_SCHOOL_ID,
      firstPayable: plan ? firstPayableInstalment(plan.instalments) : null,
      details: {
        firstName: String(l.first_name ?? ""),
        lastName: String(l.last_name ?? ""),
        preferredName: str(l.preferred_name),
        dateOfBirth: str(l.date_of_birth),
        applyingForGrade: str(l.applying_for_grade),
        guardianFirstName: str(l.guardian_first_name),
        guardianLastName: str(l.guardian_last_name),
        guardianEmail: str(l.guardian_email),
        guardianPhone: str(l.guardian_phone),
        parent2: parent2ByLead.get(leadId) ?? null,
      },
    };
  });

  return { children };
}

/** Children grouped by campus, campuses in name order. */
export function byCampus(children: readonly FinalizingChild[]): { schoolName: string; children: FinalizingChild[] }[] {
  const map = new Map<string, FinalizingChild[]>();
  for (const child of children) {
    const list = map.get(child.schoolName) ?? [];
    list.push(child);
    map.set(child.schoolName, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([schoolName, list]) => ({ schoolName, children: list }));
}
