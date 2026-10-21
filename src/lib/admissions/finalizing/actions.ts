"use server";

/**
 * FINALIZING CONTRACT - THE THINGS JIMMY DOES ON THE PAGE.
 *
 * Jimmy, 18 October 2026: "this page is only accessible by jimmy right now".
 * Every action re-checks that here, on the server. Hiding a button is not a
 * permission; a server action can be called by anybody who can load the page.
 *
 * "Jimmy" is the FOUNDER role, the same test the sidebar and the founder
 * dashboard use (canViewFounderDashboard) - one rule, not a name.
 */

import { revalidatePath } from "next/cache";

import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { loadLeadContract } from "@/lib/admissions/contract/for-lead";
import { ensurePacket } from "@/lib/admissions/contract/packet";
import { inviteProspectGuardians } from "@/lib/admissions/portal/prospect-invites";
import { convertLeadToStudentAction } from "@/lib/admissions/handoff/actions";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { GSNS_PROGRAM_CODE, decidedOn, easternToday, gsnsShareOn, shareOf } from "@/lib/scholarships/gsns";
import { applyGsnsLetterToStudent } from "@/lib/scholarships/gsns-letter";
import { createScholarshipInvoices, squareInvoiceDashboardUrl } from "@/lib/scholarships/square-invoices";
import { placementFromForm, savePlacement } from "@/lib/admissions/placement";
import { invoiceFirstPayment } from "@/lib/finance/first-payment-invoice";
import { buildTuitionSummaryHtml } from "@/lib/admissions/portal/prospect-invite-email";

import { firstPayableInstalment, type FinalizingInstalment } from "./load";
import { notifyEnrolledByFirstPayment } from "./notify";

const PAYMENT_METHODS = [
  "ach",
  "credit_card",
  "check",
  "cash",
  "square",
  "classwallet",
  "state_direct",
  "scholarship",
  "other",
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

async function requireJimmy() {
  const ctx = await getIdentityContext();
  if (!ctx) return { error: "Please sign in again." } as const;
  if (!canViewFounderDashboard(ctx)) {
    return { error: "Finalizing Contract is open to Jimmy only." } as const;
  }
  const supabase = await createAuthClient();
  return { ctx, supabase } as const;
}

function refresh() {
  revalidatePath("/dashboard/admissions/finalizing");
  revalidatePath("/dashboard/enrolled-students");
  revalidatePath("/dashboard/admissions");
}

function money(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Step 1 - the child becomes a student record. Nothing is billed or activated. */
export async function createStudentRecordAction(leadId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const result = await convertLeadToStudentAction(leadId);
  // The family's GSNS letter, if they uploaded one, becomes the award now.
  if (!(result && typeof result === "object" && "error" in result && result.error)) {
    await readLetterInto(auth.supabase, leadId);
  }
  refresh();
  return result;
}

async function readLetterInto(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  leadId: string
): Promise<{ error: string } | { text: string }> {
  const { data: student, error } = await supabase
    .from("students")
    .select("id, school_id")
    .eq("admissions_lead_id", leadId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!student) return { error: "Create the student record first." };
  const result = await applyGsnsLetterToStudent(supabase as never, createServiceRoleClient() as never, {
    leadId,
    studentId: student.id as string,
    schoolId: student.school_id as string,
  });
  if ("error" in result) return result;
  const a = result.applied;
  return {
    text:
      `Read the letter: total ${usd(a.total_award_amount)}${a.gtid ? `, GTID ${a.gtid}` : ""}. ` +
      `${a.award_percent}% = ${usd(a.awarded_amount)}` +
      (a.award_percent_deadline ? ` if the contract is signed and the first payment made before ${longDate(a.award_percent_deadline)}.` : "."),
  };
}

function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function longDate(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * A GSNS award typed by hand with the letter's total: the share is worked out
 * the same way as a letter read automatically. Anything else: as typed.
 */
function gsnsFromForm(
  programCode: string | null,
  programName: string | null,
  awardYear: string,
  formData: FormData
): { error: string } | { figures: Record<string, unknown> | null; amount: number | null } {
  const total = money(formData.get("total_award_amount"));
  const isGsns = programCode === GSNS_PROGRAM_CODE || /special needs scholarship/i.test(programName ?? "");
  if (total === null || !isGsns) return { figures: null, amount: null };
  const share = gsnsShareOn(easternToday(), awardYear);
  if (!share) return { error: "Give the school year as 2026-2027." };
  const amount = shareOf(total, share.percent);
  return {
    amount,
    figures: {
      program_code: GSNS_PROGRAM_CODE,
      total_award_amount: total,
      award_percent: share.percent,
      award_percent_deadline: share.deadline,
      state_student_number: text(formData.get("state_student_number")),
    },
  };
}

/** Finalizing card: read the family's GSNS letter into the award. */
export async function readAwardLetterAction(leadId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { count } = await auth.supabase
    .from("enrollment_packets")
    .select("lead_id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .not("contract_sent_at" as never, "is", null);
  if ((count ?? 0) > 0) return { error: LOCKED };
  const result = await readLetterInto(auth.supabase, leadId);
  refresh();
  if ("error" in result) return result;
  return { success: true, message: result.text };
}

/**
 * The GSNS share moved: a deadline passed before the contract and first
 * payment were both in, or both arrived and decided it. Jimmy applies the new
 * share; the plan is then rebuilt from it.
 */
export async function applyGsnsShareAction(awardId: string, leadId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const { data: award, error } = await supabase
    .from("scholarship_awards")
    .select("id, award_year, total_award_amount, program_code")
    .eq("id", awardId)
    .maybeSingle();
  if (error) return { error: error.message };
  const row = award as { award_year: string; total_award_amount: number | string | null; program_code: string | null } | null;
  if (!row || row.program_code !== GSNS_PROGRAM_CODE || row.total_award_amount === null) {
    return { error: "This is not a GA Special Needs Scholarship with a letter total." };
  }

  const [{ data: packet }, { data: student }] = await Promise.all([
    supabase
      .from("enrollment_packets")
      .select("signed_contract_at, completed_at")
      .eq("lead_id", leadId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("students").select("id").eq("admissions_lead_id", leadId).maybeSingle(),
  ]);
  let firstPaidAt: string | null = null;
  if (student) {
    const { data: paid } = await supabase
      .from("student_tuition_instalments")
      .select("paid_at, student_tuition_plans!inner(student_id, status)")
      .eq("student_tuition_plans.student_id", (student as { id: string }).id)
      .eq("is_paid", true)
      .order("paid_at", { ascending: true })
      .limit(1);
    firstPaidAt = ((paid ?? [])[0] as { paid_at?: string | null } | undefined)?.paid_at ?? null;
  }
  const p = packet as { signed_contract_at?: string | null; completed_at?: string | null } | null;
  const day = decidedOn(p?.signed_contract_at ?? p?.completed_at ?? null, firstPaidAt) ?? easternToday();
  const share = gsnsShareOn(day, row.award_year);
  if (!share) return { error: "The award's school year could not be read." };

  const total = Number(row.total_award_amount);
  const { error: updateError } = await supabase
    .from("scholarship_awards")
    .update({
      award_percent: share.percent,
      award_percent_deadline: share.deadline,
      awarded_amount: shareOf(total, share.percent),
    })
    .eq("id", awardId);
  if (updateError) return { error: updateError.message };
  refresh();
  return {
    success: true,
    message: `Now ${share.percent}% = ${usd(shareOf(total, share.percent))}. Rebuild the tuition plan from it.`,
  };
}

/**
 * Step 2 - a scholarship. Either awarded, with its amount, or applied for with
 * no amount yet. Never a guessed figure: an unknown award recorded as $0 is a
 * contract for full tuition with nothing flagged (migration 446).
 */
export async function addScholarshipAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const studentId = text(formData.get("student_id"));
  const schoolId = text(formData.get("school_id"));
  const programName = text(formData.get("program_name"));
  const programCode = text(formData.get("program_code"));
  const awardYear = text(formData.get("award_year"));
  const status = text(formData.get("status"));
  let amount = money(formData.get("amount"));

  if (!studentId || !schoolId) return { error: "Create the student record first." };
  if (!programName) return { error: "Name the scholarship." };
  if (!awardYear) return { error: "Give the school year, for example 2026-2027." };
  if (status !== "awarded" && status !== "applied") return { error: "Choose awarded or applied for." };
  const gsns = gsnsFromForm(programCode, programName, awardYear, formData);
  if ("error" in gsns) return gsns;
  if (gsns.amount !== null) amount = gsns.amount;
  if (status === "awarded" && (amount === null || amount < 0)) {
    return { error: "An awarded scholarship needs its amount." };
  }

  const { data: inserted, error } = await supabase.from("scholarship_awards").insert({
    ...(status === "awarded" && gsns.figures ? gsns.figures : {}),
    student_id: studentId,
    school_id: schoolId,
    program_name: programName,
    program_code: programCode,
    award_year: awardYear,
    status,
    awarded_amount: status === "awarded" ? amount : null,
    awarded_on: status === "awarded" ? new Date().toISOString().slice(0, 10) : null,
    applied_on: status === "applied" ? new Date().toISOString().slice(0, 10) : null,
  })
    .select("id, program_name, program_code, award_year, status, awarded_amount, expected_amount")
    .single();
  if (error) return { error: error.message };
  refresh();
  // Returned so the card shows it at once, without waiting on the page refresh
  // (20 Oct 2026: "Scholarship added." sat above "None recorded.").
  return {
    success: true,
    award: {
      id: String(inserted.id),
      programName: String(inserted.program_name),
      programCode: (inserted.program_code as string | null) ?? null,
      awardYear: String(inserted.award_year),
      status: String(inserted.status),
      awardedAmount: inserted.awarded_amount === null ? null : Number(inserted.awarded_amount),
      expectedAmount: inserted.expected_amount === null ? null : Number(inserted.expected_amount),
    },
  };
}

/**
 * Jimmy, 20 October 2026: "I need to be able to go back to edit if I make an
 * error with an entry." Editable until the contract is sent - after that the
 * parent has the figures, so a change means a new contract, not a quiet edit.
 */
async function contractAlreadySent(
  supabase: Awaited<ReturnType<typeof createAuthClient>>,
  awardId: string
): Promise<{ sent: boolean; error?: string }> {
  const { data: award, error } = await supabase
    .from("scholarship_awards")
    .select("student_id")
    .eq("id", awardId)
    .maybeSingle();
  if (error) return { sent: false, error: error.message };
  if (!award) return { sent: false, error: "That scholarship could not be found." };
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("admissions_lead_id")
    .eq("id", award.student_id as string)
    .maybeSingle();
  if (studentError) return { sent: false, error: studentError.message };
  const leadId = (student?.admissions_lead_id as string | null | undefined) ?? null;
  if (!leadId) return { sent: false };
  // Sent means the contract invitation went out (migration 576). The packet
  // the acceptance builds is not a sent contract.
  const { count, error: packetError } = await supabase
    .from("enrollment_packets")
    .select("lead_id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .not("contract_sent_at" as never, "is", null);
  if (packetError) return { sent: false, error: packetError.message };
  return { sent: (count ?? 0) > 0 };
}

const LOCKED = "The contract has already been sent with this figure. It can no longer be changed here.";

/** Correct a scholarship entry: name, code, year, awarded/applied, amount. */
export async function editScholarshipAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const awardId = text(formData.get("award_id"));
  const programName = text(formData.get("program_name"));
  const programCode = text(formData.get("program_code"));
  const awardYear = text(formData.get("award_year"));
  const status = text(formData.get("status"));
  let amount = money(formData.get("amount"));

  if (!awardId) return { error: "Missing scholarship." };
  if (!programName) return { error: "Name the scholarship." };
  if (!awardYear) return { error: "Give the school year, for example 2026-2027." };
  if (status !== "awarded" && status !== "applied") return { error: "Choose awarded or applied for." };
  const gsns = gsnsFromForm(programCode, programName, awardYear, formData);
  if ("error" in gsns) return gsns;
  if (gsns.amount !== null) amount = gsns.amount;
  if (status === "awarded" && (amount === null || amount < 0)) {
    return { error: "An awarded scholarship needs its amount." };
  }

  const lock = await contractAlreadySent(supabase, awardId);
  if (lock.error) return { error: lock.error };
  if (lock.sent) return { error: LOCKED };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("scholarship_awards")
    .update({
      program_name: programName,
      program_code: programCode,
      ...(status === "awarded" && gsns.figures ? gsns.figures : {}),
      award_year: awardYear,
      status,
      awarded_amount: status === "awarded" ? amount : null,
      awarded_on: status === "awarded" ? today : null,
      applied_on: status === "applied" ? today : null,
    })
    .eq("id", awardId);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

/** An applied-for scholarship gets its amount, or a scholarship is removed. */
export async function updateScholarshipAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const awardId = text(formData.get("award_id"));
  const intent = text(formData.get("intent"));
  if (!awardId) return { error: "Missing scholarship." };

  const lock = await contractAlreadySent(supabase, awardId);
  if (lock.error) return { error: lock.error };
  if (lock.sent) return { error: LOCKED };

  if (intent === "withdraw") {
    const { error } = await supabase
      .from("scholarship_awards")
      .update({ status: "withdrawn", awarded_amount: null })
      .eq("id", awardId);
    if (error) return { error: error.message };
    refresh();
    return { success: true };
  }

  const amount = money(formData.get("amount"));
  if (amount === null || amount < 0) return { error: "Enter the awarded amount." };
  const { error } = await supabase
    .from("scholarship_awards")
    .update({
      status: "awarded",
      awarded_amount: amount,
      awarded_on: new Date().toISOString().slice(0, 10),
    })
    .eq("id", awardId);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

/**
 * Step 3 - the plan is final. Only a plan whose every figure is known may be:
 * the database refuses `final` while it is waiting on a scholarship amount,
 * and refuses it without the figures the contract will print.
 */
export async function markPlanFinalAction(planId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const { data: plan, error: readError } = await supabase
    .from("student_tuition_plans")
    .select("id, lifecycle, student_id")
    .eq("id", planId)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (!plan) return { error: "That plan could not be found." };
  if (plan.lifecycle === "awaiting_scholarship_amounts") {
    return { error: "This plan is still waiting on a scholarship amount. Record it, then rebuild the plan." };
  }
  if (plan.lifecycle !== "draft") {
    return { error: `This plan is ${String(plan.lifecycle).replace(/_/g, " ")}, not a draft.` };
  }

  const { data: pending } = await supabase
    .from("scholarship_awards")
    .select("id")
    .eq("student_id", plan.student_id)
    .eq("status", "applied")
    .limit(1);
  if ((pending ?? []).length > 0) {
    return { error: "A scholarship is still applied for with no amount. Record it first." };
  }

  const { error } = await supabase
    .from("student_tuition_plans")
    .update({
      lifecycle: "final",
      lifecycle_changed_at: new Date().toISOString(),
      lifecycle_note: "Marked final on Finalizing Contract",
    })
    .eq("id", planId);
  if (error) return { error: error.message };

  // The state's payments, one Square invoice each (Jimmy, 20 Oct 2026). The
  // plan is final whatever Square says; a failure shows on the card to retry.
  const invoices = await createScholarshipInvoices(supabase as never, {
    studentId: plan.student_id as string,
    planId,
  });
  refresh();
  return { success: true, message: `Plan is final. ${describeInvoiceRun(invoices)}` };
}

function describeInvoiceRun(run: Awaited<ReturnType<typeof createScholarshipInvoices>>): string {
  if ("error" in run) return `Square invoices not made: ${run.error}`;
  if (run.created === 0 && run.failed === 0) return "";
  const made = run.created > 0 ? `${run.created} state scholarship invoice${run.created === 1 ? "" : "s"} made in Square.` : "";
  const failed = run.failed > 0 ? ` ${run.failed} failed: ${run.errors[0]}` : "";
  return `${made}${failed}`.trim();
}

/** Send (or resend after a failure) the Square invoice for the first payment. */
export async function invoiceFirstPaymentAction(planId: string, leadId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const result = await invoiceFirstPayment(createServiceRoleClient() as never, { planId, leadId });
  refresh();
  if ("error" in result) return { error: `The invoice was not sent: ${result.error}` };
  return { success: true, message: `Square has emailed the first-payment invoice${result.invoiceNumber ? ` (#${result.invoiceNumber})` : ""}.` };
}

/** Jimmy sets or corrects the HS classes and the actual start date. */
export async function updatePlacementAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const leadId = text(formData.get("lead_id"));
  if (!leadId) return { error: "Missing child." };
  const parsed = placementFromForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const problem = await savePlacement(auth.supabase as never, leadId, parsed.value);
  if (problem) return { error: problem };
  refresh();
  return { success: true, message: "Classes and start date saved." };
}

/** Retry, or make them for a plan that was final before this existed. */
export async function createScholarshipInvoicesAction(studentId: string, planId: string | null) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const run = await createScholarshipInvoices(auth.supabase as never, { studentId, planId });
  refresh();
  if ("error" in run) return { error: run.error };
  if (run.failed > 0) return { error: describeInvoiceRun(run) };
  return { success: true, message: describeInvoiceRun(run) || "Nothing left to make." };
}

/**
 * The state paid. Recorded as a scholarship receipt against the award; the
 * Square invoice is then marked paid by Jimmy in Square (its API cannot).
 */
export async function recordStatePaymentAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const invoiceId = text(formData.get("invoice_id"));
  const amount = money(formData.get("amount"));
  const receivedOn = text(formData.get("received_on"));
  const reference = text(formData.get("reference"));
  if (!invoiceId) return { error: "Missing invoice." };
  if (amount === null || amount <= 0) return { error: "Enter the amount the state paid." };
  if (!receivedOn) return { error: "Enter the date it arrived." };

  const { data: inv, error } = await supabase
    .from("scholarship_invoices" as never)
    .select("id, award_id, label, square_invoice_id, receipt_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) return { error: error.message };
  const row = inv as { award_id: string; label: string; square_invoice_id: string | null; receipt_id: string | null } | null;
  if (!row) return { error: "That invoice could not be found." };
  if (row.receipt_id) return { error: "This state payment is already recorded." };

  const { data: receipt, error: receiptError } = await supabase
    .from("scholarship_receipts")
    .insert({
      award_id: row.award_id,
      amount,
      received_on: receivedOn,
      reference,
      notes: `State payment: ${row.label}`,
    })
    .select("id")
    .single();
  if (receiptError) return { error: receiptError.message };

  const { error: linkError } = await supabase
    .from("scholarship_invoices" as never)
    .update({ receipt_id: (receipt as { id: string }).id } as never)
    .eq("id", invoiceId);
  if (linkError) return { error: linkError.message };
  refresh();
  return {
    success: true,
    message: row.square_invoice_id
      ? "Recorded. Now mark it paid in Square: Mark as paid → Other → State scholarship."
      : "Recorded.",
    openUrl: row.square_invoice_id ? squareInvoiceDashboardUrl(row.square_invoice_id) : null,
  };
}

/** Jimmy says he has marked it paid in Square. */
export async function markSquareInvoicePaidAction(invoiceId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { error } = await auth.supabase
    .from("scholarship_invoices" as never)
    .update({ square_marked_paid_at: new Date().toISOString() } as never)
    .eq("id", invoiceId);
  if (error) return { error: error.message };
  refresh();
  return { success: true, message: "Marked paid in Square." };
}

/**
 * Step 5 - a payment. Recorded against one instalment.
 *
 * A PART PAYMENT STAYS UNPAID. Only an amount that covers the instalment marks
 * it paid; less is recorded and the instalment stays open.
 *
 * THE FIRST PAYMENT ENROLLS THE CHILD. Jimmy: "once the initial payment is
 * made move these to Enrolled Students". When the first instalment that asks
 * for money is paid in full, the lead moves to `enrolled` and Jimmy is told.
 */
export async function recordPaymentAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase, ctx } = auth;

  const instalmentId = text(formData.get("instalment_id"));
  const leadId = text(formData.get("lead_id"));
  const amount = money(formData.get("amount"));
  const paidOn = text(formData.get("paid_on"));
  const method = text(formData.get("method"));
  const reference = text(formData.get("reference"));
  const notes = text(formData.get("notes"));

  if (!instalmentId || !leadId) return { error: "Missing payment details." };
  if (amount === null || amount <= 0) return { error: "Enter the amount received." };
  if (!paidOn || !/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { error: "Enter the date it was received." };
  if (!method || !(PAYMENT_METHODS as readonly string[]).includes(method)) {
    return { error: "Choose how it was paid." };
  }

  const { data: inst, error: instError } = await supabase
    .from("student_tuition_instalments")
    .select("id, plan_id, amount, is_paid, paid_amount")
    .eq("id", instalmentId)
    .maybeSingle();
  if (instError) return { error: instError.message };
  if (!inst) return { error: "That payment line could not be found." };
  if (inst.is_paid) return { error: "That payment is already recorded as paid." };

  const already = Number(inst.paid_amount ?? 0);
  const total = Math.round((already + amount) * 100) / 100;
  const due = Number(inst.amount);
  const fullyPaid = total >= due;

  const { error: updateError } = await supabase
    .from("student_tuition_instalments")
    .update({
      paid_amount: total,
      paid_at: paidOn,
      is_paid: fullyPaid,
      payment_method: method as PaymentMethod,
      payment_reference: reference,
      payment_notes: notes,
      payment_recorded_by: ctx.id,
      payment_recorded_at: new Date().toISOString(),
    })
    .eq("id", instalmentId);
  if (updateError) return { error: updateError.message };

  let enrolled = false;
  if (fullyPaid) {
    const { data: all } = await supabase
      .from("student_tuition_instalments")
      .select("id, sequence, amount, is_paid")
      .eq("plan_id", inst.plan_id);
    const first = firstPayableInstalment(
      ((all ?? []) as Record<string, unknown>[]).map(
        (i): FinalizingInstalment => ({
          id: String(i.id),
          sequence: Number(i.sequence),
          label: null,
          dueDate: null,
          amount: Number(i.amount),
          isPaid: Boolean(i.is_paid),
          paidAt: null,
          paidAmount: null,
          paymentMethod: null,
          paymentReference: null,
          squareInvoiceId: null,
          squareInvoiceNumber: null,
          squareInvoiceError: null,
        })
      )
    );

    const { data: lead } = await supabase
      .from("admissions_leads")
      .select("lead_stage")
      .eq("id", leadId)
      .maybeSingle();

    if (first && first.isPaid && lead?.lead_stage === "accepted") {
      const moved = await transitionCaseStage(supabase, leadId, "enrolled", ctx.id);
      if (moved.error) {
        refresh();
        return {
          success: true,
          enrolled: false,
          warning: `Payment recorded, but the move to Enrolled failed: ${moved.error}`,
        };
      }
      enrolled = true;
      await notifyEnrolledByFirstPayment(supabase, leadId);
    }
  }

  refresh();
  return { success: true, fullyPaid, enrolled };
}

/**
 * Step 4 - send the contract.
 *
 * Refuses unless the contract renders in full with this family's figures:
 * loadLeadContract returns an error for no final plan, a scholarship still
 * waiting on its amount, or a campus with no named signatory. Nothing
 * unresolved reaches a family.
 *
 * Then: the application and packet records the signature needs, a parent row
 * from what the family gave on the inquiry form if there is none (parent
 * access is matched on that email), and the invitation that creates the
 * parent's JAG login and lands them on /contract.
 *
 * `confirm` must be true - the screen shows the letter first.
 */
export async function sendContractAction(leadId: string, confirm: boolean) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;
  if (!confirm) return { error: "Confirm before sending." };

  const loaded = await loadLeadContract(supabase, leadId);
  if ("error" in loaded) return { error: loaded.error };
  const contract = loaded.contract;

  const packet = await ensurePacket(supabase, {
    leadId,
    schoolId: contract.schoolId,
    schoolYearId: contract.schoolYearId,
  });
  if ("error" in packet) return { error: packet.error };

  const { data: lead } = await supabase
    .from("admissions_leads")
    .select("first_name, guardian_first_name, guardian_last_name, guardian_email, guardian_phone, schools(organization_id)")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "That child could not be found." };

  let { data: guardians } = await supabase
    .from("admissions_lead_guardians")
    .select("id, email, primary_guardian")
    .eq("lead_id", leadId)
    .not("email", "is", null)
    .order("primary_guardian", { ascending: false });

  if (!guardians || guardians.length === 0) {
    if (!lead.guardian_email) return { error: "There is no parent email on this child's record." };
    const { error: gError } = await supabase.from("admissions_lead_guardians").insert({
      lead_id: leadId,
      first_name: lead.guardian_first_name ?? "Parent/Guardian",
      last_name: lead.guardian_last_name ?? "Household",
      email: lead.guardian_email,
      phone: lead.guardian_phone ?? null,
      primary_guardian: true,
      receives_billing: true,
    });
    if (gError) return { error: `Could not record the parent: ${gError.message}` };
    const reread = await supabase
      .from("admissions_lead_guardians")
      .select("id, email, primary_guardian")
      .eq("lead_id", leadId)
      .not("email", "is", null);
    guardians = reread.data;
  }

  const primary = (guardians ?? [])[0];
  if (!primary) return { error: "There is no parent to send the contract to." };

  const schools = (lead as Record<string, unknown>).schools as
    | { organization_id?: string }
    | { organization_id?: string }[]
    | null;
  const organizationId = (Array.isArray(schools) ? schools[0]?.organization_id : schools?.organization_id) ?? "";

  const result = await inviteProspectGuardians({
    leadId,
    guardianIds: [String(primary.id)],
    organizationId,
    schoolId: contract.schoolId,
    childName: String(lead.first_name ?? contract.studentName),
    signatory: "Jimmy Arispe",
    schoolName: contract.schoolName,
    purpose: "contract",
    tuitionSummaryHtml: buildTuitionSummaryHtml(contract.fields),
    owesNothing: contract.fields.remaining_due <= 0,
  });

  const outcome = result.invited[0];
  if (outcome?.ok) {
    await supabase
      .from("enrollment_packets")
      .update({ contract_sent_at: new Date().toISOString() } as never)
      .eq("id", packet.packet.id);
  }
  refresh();
  if (!outcome) return { error: "No invitation was sent." };
  if (!outcome.ok) {
    return {
      success: true,
      warning: `Contract is ready to sign, but no invitation was sent to ${outcome.email}: ${outcome.error}`,
    };
  }
  return { success: true, sentTo: outcome.email };
}

/**
 * EDIT ANYTHING ABOUT THE CHILD AND THE FAMILY.
 *
 * Jimmy, 18 October 2026: "i need to be able to change any information
 * during this stage". The child's name, date of birth and grade, and both
 * parents. Tuition and scholarships are edited in their own steps.
 *
 * WRITTEN EVERYWHERE THE FACT LIVES, so the contract and the records agree:
 * the lead, the primary parent row (which is also what lets a parent's login
 * see this child - it matches on email), and the student record once there is
 * one.
 *
 * A SIGNED CONTRACT DOES NOT CHANGE. Migration 571 keeps the copy the parent
 * signed; edits after that change the record, not the signed document.
 */
export async function updateChildDetailsAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const leadId = text(formData.get("lead_id"));
  if (!leadId) return { error: "Missing child." };

  const firstName = text(formData.get("first_name"));
  const lastName = text(formData.get("last_name"));
  const preferredName = text(formData.get("preferred_name"));
  const dateOfBirth = text(formData.get("date_of_birth"));
  const grade = text(formData.get("applying_for_grade"));
  const gFirst = text(formData.get("guardian_first_name"));
  const gLast = text(formData.get("guardian_last_name"));
  const gEmail = text(formData.get("guardian_email"))?.toLowerCase() ?? null;
  const gPhone = text(formData.get("guardian_phone"));
  const p2Id = text(formData.get("parent2_id"));
  const p2First = text(formData.get("parent2_first_name"));
  const p2Last = text(formData.get("parent2_last_name"));
  const p2Email = text(formData.get("parent2_email"))?.toLowerCase() ?? null;
  const p2Phone = text(formData.get("parent2_phone"));

  if (!firstName || !lastName) return { error: "The child needs a first and last name." };
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return { error: "Date of birth is not a date." };
  if (gEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gEmail)) return { error: "Parent 1's email is not an email address." };
  if (p2Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p2Email)) return { error: "Parent 2's email is not an email address." };

  const { data: before } = await supabase
    .from("admissions_leads")
    .select("guardian_email")
    .eq("id", leadId)
    .maybeSingle();
  if (!before) return { error: "That child could not be found." };

  const { error: leadError } = await supabase
    .from("admissions_leads")
    .update({
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName,
      date_of_birth: dateOfBirth,
      applying_for_grade: grade,
      guardian_first_name: gFirst,
      guardian_last_name: gLast,
      guardian_email: gEmail,
      guardian_phone: gPhone,
    })
    .eq("id", leadId);
  if (leadError) return { error: leadError.message };

  const warnings: string[] = [];

  // Parent 1: the primary guardian row, if there is one.
  const { data: primary } = await supabase
    .from("admissions_lead_guardians")
    .select("id")
    .eq("lead_id", leadId)
    .eq("primary_guardian", true)
    .limit(1)
    .maybeSingle();
  if (primary) {
    const { error } = await supabase
      .from("admissions_lead_guardians")
      .update({
        first_name: gFirst ?? "Parent/Guardian",
        last_name: gLast ?? "Household",
        email: gEmail,
        phone: gPhone,
      })
      .eq("id", primary.id);
    if (error) warnings.push(`Parent 1's contact row was not updated: ${error.message}`);
  }
  const oldEmail = (before.guardian_email as string | null)?.toLowerCase() ?? null;
  if (oldEmail && gEmail && oldEmail !== gEmail) {
    warnings.push(
      `Parent 1's email changed from ${oldEmail}. If that parent already has a JAG login, it no longer opens this child's contract — send the contract again to invite the new address.`
    );
  }

  // Parent 2: update the row, or add one if a name was given.
  if (p2Id) {
    const { error } = await supabase
      .from("admissions_lead_guardians")
      .update({ first_name: p2First ?? "", last_name: p2Last ?? "", email: p2Email, phone: p2Phone })
      .eq("id", p2Id);
    if (error) warnings.push(`Parent 2 was not updated: ${error.message}`);
  } else if (p2First || p2Last) {
    const { error } = await supabase.from("admissions_lead_guardians").insert({
      lead_id: leadId,
      first_name: p2First ?? "",
      last_name: p2Last ?? "",
      email: p2Email,
      phone: p2Phone,
      primary_guardian: false,
    });
    if (error) warnings.push(`Parent 2 was not added: ${error.message}`);
  }

  // The student record, once there is one.
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("admissions_lead_id", leadId)
    .limit(1)
    .maybeSingle();
  if (student) {
    const { error } = await supabase
      .from("students")
      .update({
        first_name: firstName,
        last_name: lastName,
        preferred_name: preferredName,
        date_of_birth: dateOfBirth,
        grade_level: grade,
      })
      .eq("id", student.id);
    if (error) warnings.push(`The student record was not updated: ${error.message}`);
  }

  refresh();
  revalidatePath(`/dashboard/admissions/finalizing/${leadId}/contract`);
  return warnings.length ? { success: true, warning: warnings.join(" ") } : { success: true };
}

/**
 * Undo a payment recorded by mistake. Clears what was recorded on the
 * instalment; the schedule itself is untouched. Only while the child is still
 * in Finalizing Contract - once the first payment has enrolled them, moving
 * them back is a separate decision, not an undo.
 */
export async function undoPaymentAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const instalmentId = text(formData.get("instalment_id"));
  const leadId = text(formData.get("lead_id"));
  if (!instalmentId || !leadId) return { error: "Missing payment." };

  const { data: lead } = await supabase.from("admissions_leads").select("lead_stage").eq("id", leadId).maybeSingle();
  if (lead?.lead_stage !== "accepted") {
    return { error: "This child is already enrolled. A payment that enrolled them cannot be undone from here." };
  }

  const { error } = await supabase
    .from("student_tuition_instalments")
    .update({
      is_paid: false,
      paid_at: null,
      paid_amount: null,
      payment_method: null,
      payment_reference: null,
      payment_notes: null,
      payment_recorded_by: null,
      payment_recorded_at: null,
    })
    .eq("id", instalmentId);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}
