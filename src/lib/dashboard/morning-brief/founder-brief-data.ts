import { cache } from "react";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Founder Morning Brief — the data behind the revenue-first homepage.
 *
 * Design rule, and the reason this file is shaped the way it is: a number is
 * either real or it is absent. Nothing here substitutes a zero, an average, or
 * a plausible-looking placeholder for data the platform does not hold. A brief
 * that quietly reports $0 EBITDA is worse than one that says "not connected",
 * because the first looks like a business result and the second looks like a
 * missing integration — which is what it is.
 */

/** Annual tuition per campus, in dollars. Source: Jimmy, 24 Aug 2026. */
export const ANNUAL_TUITION: Record<string, number> = {
  "The Academy GA": 19_950,
  "The Academy FL": 16_000,
  "The Academy Virtual": 15_000,
  /**
   * Published rate is $850/month for The Experience (theacademyhs.org/hs-tuition).
   * Given as "$850 per year" in the source message — read as monthly and
   * annualised. Confirm before this figure reaches a board pack.
   */
  "The Academy HS": 10_200,
};

/** Pipeline stages that represent a family who has said yes but is not enrolled. */
const CLOSING_STAGES = ["accepted", "application_submitted", "admissions_review"];
/** Stages that are still genuinely open opportunity. */
const DEAD_STAGES = ["declined", "not_returning", "enrolled"];

export interface CampusLine {
  schoolId: string;
  campus: string;
  students: number;
  pastStudents: number;
  annualTuition: number | null;
  /** students × tuition. Null when no tuition is configured for the campus. */
  revenue: number | null;
  pipelineOpen: number;
  pipelineClosing: number;
  /** Value of families at a closing stage, at list tuition. */
  pipelineValue: number | null;
}

export interface FounderBrief {
  campuses: CampusLine[];
  totals: {
    students: number;
    pastStudents: number;
    revenue: number | null;
    pipelineOpen: number;
    pipelineClosing: number;
    pipelineValue: number | null;
  };
  /** Open admissions tasks — the "waiting on you" queue. */
  tasks: Array<{ id: string; name: string; leadName: string | null; campus: string | null }>;
  /**
   * Inputs the platform does not yet hold. Rendered as named gaps rather than
   * zeros so the brief never implies a result it cannot support.
   */
  missing: string[];
}

export const getFounderBrief = cache(async (): Promise<FounderBrief> => {
  const supabase = await createAuthClient();

  const [schoolsRes, studentsRes, leadsRes, tasksRes] = await Promise.all([
    supabase.from("schools").select("id, name").order("name"),
    supabase.from("students").select("school_id, enrollment_status"),
    supabase.from("admissions_leads").select("school_id, lead_stage"),
    supabase
      .from("admissions_tasks")
      .select("id, task_name, task_status, lead_id")
      .eq("task_status", "open")
      .limit(12),
  ]);

  const schools = schoolsRes.data ?? [];
  const students = studentsRes.data ?? [];
  const leads = leadsRes.data ?? [];

  const campuses: CampusLine[] = schools.map((school) => {
    const mine = students.filter((s) => s.school_id === school.id);
    const enrolled = mine.filter((s) => s.enrollment_status === "enrolled").length;
    const past = mine.filter(
      (s) => s.enrollment_status === "withdrawn" || s.enrollment_status === "graduated"
    ).length;

    const myLeads = leads.filter((l) => l.school_id === school.id);
    const open = myLeads.filter((l) => !DEAD_STAGES.includes(String(l.lead_stage))).length;
    const closing = myLeads.filter((l) => CLOSING_STAGES.includes(String(l.lead_stage))).length;

    const tuition = ANNUAL_TUITION[school.name] ?? null;

    return {
      schoolId: school.id,
      campus: school.name,
      students: enrolled,
      pastStudents: past,
      annualTuition: tuition,
      revenue: tuition == null ? null : enrolled * tuition,
      pipelineOpen: open,
      pipelineClosing: closing,
      pipelineValue: tuition == null ? null : closing * tuition,
    };
  });

  const sum = (pick: (c: CampusLine) => number | null): number | null => {
    const vals = campuses.map(pick);
    return vals.some((v) => v == null) && vals.every((v) => v == null)
      ? null
      : vals.reduce<number>((a, v) => a + (v ?? 0), 0);
  };

  // Lead names for the task queue — one extra round trip, only when tasks exist.
  const taskRows = tasksRes.data ?? [];
  let tasks: FounderBrief["tasks"] = [];
  if (taskRows.length) {
    const leadIds = taskRows.map((t) => t.lead_id).filter(Boolean) as string[];
    const { data: leadRows } = leadIds.length
      ? await supabase
          .from("admissions_leads")
          .select("id, first_name, last_name, school_id")
          .in("id", leadIds)
      : { data: [] as Array<{ id: string; first_name: string; last_name: string; school_id: string }> };
    const byId = new Map((leadRows ?? []).map((l) => [l.id, l]));
    const schoolName = new Map(schools.map((s) => [s.id, s.name]));
    tasks = taskRows.map((t) => {
      const lead = t.lead_id ? byId.get(t.lead_id) : undefined;
      return {
        id: t.id,
        name: String(t.task_name ?? "Task"),
        leadName: lead ? `${lead.first_name} ${lead.last_name}`.trim() : null,
        campus: lead ? schoolName.get(lead.school_id) ?? null : null,
      };
    });
  }

  const missing: string[] = [
    "Seat capacity per campus",
    "Scholarships and discounts granted",
    "Payroll and operating costs",
    "Payments and accounts receivable",
    "Cash balance",
  ];

  return {
    campuses,
    totals: {
      students: campuses.reduce((a, c) => a + c.students, 0),
      pastStudents: campuses.reduce((a, c) => a + c.pastStudents, 0),
      revenue: sum((c) => c.revenue),
      pipelineOpen: campuses.reduce((a, c) => a + c.pipelineOpen, 0),
      pipelineClosing: campuses.reduce((a, c) => a + c.pipelineClosing, 0),
      pipelineValue: sum((c) => c.pipelineValue),
    },
    tasks,
    missing,
  };
});
