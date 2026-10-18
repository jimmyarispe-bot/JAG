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
  refresh();
  return result;
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
  const amount = money(formData.get("amount"));

  if (!studentId || !schoolId) return { error: "Create the student record first." };
  if (!programName) return { error: "Name the scholarship." };
  if (!awardYear) return { error: "Give the school year, for example 2026-2027." };
  if (status !== "awarded" && status !== "applied") return { error: "Choose awarded or applied for." };
  if (status === "awarded" && (amount === null || amount < 0)) {
    return { error: "An awarded scholarship needs its amount." };
  }

  const { error } = await supabase.from("scholarship_awards").insert({
    student_id: studentId,
    school_id: schoolId,
    program_name: programName,
    program_code: programCode,
    award_year: awardYear,
    status,
    awarded_amount: status === "awarded" ? amount : null,
    awarded_on: status === "awarded" ? new Date().toISOString().slice(0, 10) : null,
    applied_on: status === "applied" ? new Date().toISOString().slice(0, 10) : null,
  });
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
  refresh();
  return { success: true };
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
  });

  const outcome = result.invited[0];
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
