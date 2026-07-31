/**
 * Portal student directory reads — keep Supabase out of React layouts/pages.
 */

import type { AuthClient } from "@/lib/supabase/auth-client";


export type PortalStudentSummary = {
  id: string;
  first_name: string;
  last_name: string;
};

export type PortalStudentFormRow = PortalStudentSummary & {
  family_id: string | null;
  school_id: string | null;
};

export async function listPortalStudentSummaries(
  supabase: AuthClient,
  studentIds: string[]
): Promise<PortalStudentSummary[]> {
  if (!studentIds.length) return [];
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds);
  return (data as PortalStudentSummary[] | null) ?? [];
}

/** Forms center needs school/family scope — still not called from React with raw clients for unrelated tables. */
export async function listPortalStudentsForForms(
  supabase: AuthClient,
  studentIds: string[]
): Promise<PortalStudentFormRow[]> {
  if (!studentIds.length) return [];
  const { data } = await supabase
    .from("students")
    .select("id, first_name, last_name, family_id, school_id")
    .in("id", studentIds);
  return (data as PortalStudentFormRow[] | null) ?? [];
}

export async function getPortalStudentDisplayName(
  supabase: AuthClient,
  studentId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("first_name, last_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!data) return null;
  return `${data.first_name} ${data.last_name}`.trim();
}

export type PortalGrowthGoal = {
  id: string;
  title: string;
  description: string | null;
  progress_pct: number | string | null;
  status: string;
};

export async function listPortalStudentGrowthGoals(
  supabase: AuthClient,
  studentId: string
): Promise<PortalGrowthGoal[]> {
  const { data } = await supabase
    .from("student_growth_goals")
    .select("id, title, description, progress_pct, status")
    .eq("student_id", studentId)
    .in("status", ["active", "on_track", "at_risk"])
    .order("updated_at", { ascending: false });
  return (data as PortalGrowthGoal[] | null) ?? [];
}
