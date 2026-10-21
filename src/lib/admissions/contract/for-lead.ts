import type { SupabaseClient } from "@supabase/supabase-js";

import { gradeLabel } from "@/lib/constants/grades";

import { FL_CONTRACT_BLOCKS } from "./fl-2026-09-06";
import { GA_CONTRACT_BLOCKS, type ContractBlock } from "./ga-2026-09-06";
import { HS_CONTRACT_BLOCKS } from "./hs-2026-09-06";
import {
  renderContractTemplate,
  type ContractFields,
  type ContractInstalment,
} from "./render";
import { VIRTUAL_CONTRACT_BLOCKS } from "./virtual-2026-09-06";

/**
 * ONE CHILD'S CONTRACT, WITH THEIR FAMILY'S OWN FIGURES IN IT.
 *
 * Reads the lead, the campus (who the family contracts with, who signs), the
 * student record, the FINAL tuition plan and its instalments, and the awarded
 * scholarships; fills ContractFields; renders each of the campus's five
 * blocks.
 *
 * REFUSES rather than guessing. No final plan, no campus signatory, a
 * scholarship still waiting on its amount - each returns an error naming what
 * is missing. "NOTHING UNRESOLVED REACHES A FAMILY" (render.ts) starts here.
 *
 * The client passed in must be able to read all of it. Staff pass their own;
 * the parent page passes the service-role client AFTER proving, with the
 * parent's own session, that this is their child.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

/** The contract text each campus signs, by campus name. */
export function contractBlocksForSchool(schoolName: string): readonly ContractBlock[] | null {
  const name = schoolName.trim().toLowerCase();
  if (name === "the academy ga") return GA_CONTRACT_BLOCKS;
  if (name === "the academy fl") return FL_CONTRACT_BLOCKS;
  if (name === "the academy hs") return HS_CONTRACT_BLOCKS;
  if (name === "the academy virtual") return VIRTUAL_CONTRACT_BLOCKS;
  return null;
}

export interface RenderedContractBlock {
  templateKey: string;
  title: string;
  sortOrder: number;
  html: string;
}

export interface LeadContract {
  leadId: string;
  schoolId: string;
  schoolName: string;
  studentName: string;
  guardianName: string;
  planId: string;
  planLifecycle: string;
  schoolYearId: string;
  fields: ContractFields;
  blocks: RenderedContractBlock[];
}

function n(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

export async function loadLeadContract(
  db: AnyClient,
  leadId: string
): Promise<{ contract: LeadContract } | { error: string }> {
  const { data: lead, error: leadError } = await db
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, date_of_birth, applying_for_grade, current_grade, guardian_first_name, guardian_last_name, school_id, schools(name, contracting_legal_name, signatory_line)"
    )
    .eq("id", leadId)
    .maybeSingle();
  if (leadError) return { error: `Could not read the child: ${leadError.message}` };
  if (!lead) return { error: "That child could not be found." };

  const schoolRaw = (lead as Record<string, unknown>).schools as
    | { name?: string; contracting_legal_name?: string | null; signatory_line?: string | null }
    | { name?: string; contracting_legal_name?: string | null; signatory_line?: string | null }[]
    | null;
  const school = Array.isArray(schoolRaw) ? schoolRaw[0] : schoolRaw;
  const schoolName = school?.name ?? "";
  const blocks = contractBlocksForSchool(schoolName);
  if (!blocks) return { error: `${schoolName || "This campus"} has no contract.` };
  if (!school?.contracting_legal_name || !school?.signatory_line) {
    return {
      error: `${schoolName} does not yet say who the family contracts with or who signs for the school (migration 448).`,
    };
  }

  const { data: student, error: studentError } = await db
    .from("students")
    .select("id")
    .eq("admissions_lead_id", leadId)
    .limit(1)
    .maybeSingle();
  if (studentError) return { error: `Could not read the student record: ${studentError.message}` };
  if (!student) return { error: "Create the student record first." };

  const { data: plan, error: planError } = await db
    .from("student_tuition_plans")
    .select(
      "id, lifecycle, billing_mode, annual_tuition, prorated_tuition, proration_label, billing_basis, remaining_due, monthly_amount, school_year_id, school_years(name)"
    )
    .eq("student_id", student.id)
    .in("lifecycle", ["final", "contracted"])
    .not("status", "in", "(superseded,cancelled)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (planError) return { error: `Could not read the tuition plan: ${planError.message}` };
  if (!plan) return { error: "There is no final tuition plan. Mark the plan final first." };
  if (plan.billing_mode !== "scheduled") {
    return {
      error:
        "This plan is month to month with no schedule. The contract states the Schedule of Tuition Payments, so build a scheduled plan.",
    };
  }

  const [instResult, awardsResult] = await Promise.all([
    db
      .from("student_tuition_instalments")
      .select("sequence, label, due_date, amount")
      .eq("plan_id", plan.id)
      .order("sequence", { ascending: true }),
    db
      .from("scholarship_awards")
      .select("status, awarded_amount")
      .eq("student_id", student.id)
      .in("status", ["applied", "awarded"]),
  ]);
  if (instResult.error) return { error: `Could not read the schedule: ${instResult.error.message}` };
  if (awardsResult.error) return { error: `Could not read scholarships: ${awardsResult.error.message}` };

  const awards = (awardsResult.data ?? []) as { status: string; awarded_amount: unknown }[];
  if (awards.some((a) => a.status === "applied")) {
    return { error: "A scholarship is still waiting on its amount." };
  }
  const scholarshipTotal =
    Math.round(awards.reduce((sum, a) => sum + (n(a.awarded_amount) ?? 0), 0) * 100) / 100;

  const instalments: ContractInstalment[] = ((instResult.data ?? []) as Record<string, unknown>[]).map(
    (i) => ({
      label: String(i.label ?? `Payment ${i.sequence}`),
      dueDate: typeof i.due_date === "string" ? i.due_date : null,
      amount: n(i.amount) ?? 0,
    })
  );

  const l = lead as Record<string, unknown>;
  // The legal first name, never the preferred one: this is a contract.
  const first = String(l.first_name ?? "").trim();
  const studentName = `${first} ${String(l.last_name ?? "").trim()}`.trim();
  const guardianName = `${l.guardian_first_name ?? ""} ${l.guardian_last_name ?? ""}`.trim();
  const grade = (l.applying_for_grade ?? l.current_grade) as string | null;
  const yearRaw = (plan as Record<string, unknown>).school_years as { name?: string } | { name?: string }[] | null;
  const schoolYear = (Array.isArray(yearRaw) ? yearRaw[0]?.name : yearRaw?.name) ?? "";

  const { data: guardians } = await db
    .from("admissions_lead_guardians")
    .select("first_name, last_name, primary_guardian")
    .eq("lead_id", leadId)
    .order("primary_guardian", { ascending: false });
  const second = ((guardians ?? []) as Record<string, unknown>[])
    .map((g) => `${g.first_name ?? ""} ${g.last_name ?? ""}`.trim())
    .filter((name) => name && name.toLowerCase() !== guardianName.toLowerCase())[0];

  const fields: ContractFields = {
    student_name: studentName,
    student_birthdate: typeof l.date_of_birth === "string" ? l.date_of_birth : null,
    student_grade: grade ? gradeLabel(grade) : null,
    school_year: schoolYear,
    guardian_1_name: guardianName,
    guardian_2_name: second ?? null,
    school_name: schoolName,
    school_legal_name: school.contracting_legal_name,
    school_signatory: school.signatory_line,
    annual_tuition: n(plan.annual_tuition) ?? 0,
    prorated_tuition: n(plan.prorated_tuition),
    proration_label: (plan.proration_label as string | null) ?? null,
    billing_basis: n(plan.billing_basis) ?? 0,
    // Capped at what is billed: Georgia pays the lesser of the award and the
    // tuition, and a contract must not show more scholarship than tuition
    // (Jimmy, 21 Oct 2026, Harris Borum: "cap at tuition").
    scholarship_total: Math.min(scholarshipTotal, n(plan.billing_basis) ?? scholarshipTotal),
    remaining_due: n(plan.remaining_due) ?? 0,
    monthly_amount: n(plan.monthly_amount),
    tuition_insurance_cost: Math.round((n(plan.annual_tuition) ?? 0) * 2.5) / 100,
    instalments,
  };

  try {
    const rendered = [...blocks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((block) => ({
        templateKey: block.templateKey,
        title: block.title,
        sortOrder: block.sortOrder,
        html: renderContractTemplate(block.bodyHtml, fields, { templateKey: block.templateKey }),
      }));
    return {
      contract: {
        leadId,
        schoolId: String(l.school_id),
        schoolName,
        studentName,
        guardianName,
        planId: String(plan.id),
        planLifecycle: String(plan.lifecycle),
        schoolYearId: String(plan.school_year_id),
        fields,
        blocks: rendered,
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
