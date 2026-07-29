/**
 * Student assignments view — reads compliance deadline buckets (existing assignment sync).
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getStudentDeadlines } from "@/lib/compliance/deadlines";
import type { ComplianceObligation } from "@/lib/compliance/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type StudentAssignmentBuckets = {
  current: ComplianceObligation[];
  dueSoon: ComplianceObligation[];
  late: ComplianceObligation[];
  completed: ComplianceObligation[];
};

export async function getStudentAssignmentBuckets(
  supabase: AuthClient,
  studentId: string
): Promise<StudentAssignmentBuckets> {
  const deadlines = await getStudentDeadlines(supabase, studentId);
  const current = [
    ...(deadlines.today ?? []),
    ...(deadlines.dueTomorrow ?? []),
    ...(deadlines.thisWeek ?? []),
  ];
  const dueSoon = [
    ...(deadlines.dueTomorrow ?? []),
    ...(deadlines.upcoming ?? deadlines.next30Days ?? []),
  ];
  return {
    current,
    dueSoon,
    late: deadlines.overdue ?? [],
    completed: deadlines.completed ?? [],
  };
}
