import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface FamilyDependencyHit {
  key: string;
  label: string;
  count: number;
}

export interface FamilyDependencyReport {
  familyId: string;
  blocking: FamilyDependencyHit[];
  canDelete: boolean;
}

async function countEq(
  supabase: AuthClient,
  table: string,
  column: string,
  value: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, value);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function inspectFamilyDependencies(
  supabase: AuthClient,
  familyId: string
): Promise<FamilyDependencyReport> {
  const blocking: FamilyDependencyHit[] = [];

  const studentCount = await countEq(supabase, "students", "family_id", familyId);
  if (studentCount > 0) {
    blocking.push({ key: "students", label: "Students", count: studentCount });
  }

  const probes: Array<{ key: string; label: string; table: string; column?: string }> = [
    { key: "billing", label: "Billing", table: "family_billing_accounts" },
    { key: "documents", label: "Documents", table: "portal_form_submissions" },
    { key: "communications", label: "Communications", table: "portal_conversations" },
    { key: "scholarships", label: "Scholarships", table: "scholarship_applications", column: "family_id" },
    { key: "notes", label: "Notes", table: "platform_notes", column: "family_id" },
  ];

  // Scholarships may be student-scoped — also count via students
  if (studentCount > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id")
      .eq("family_id", familyId);
    const ids = (students ?? []).map((s) => s.id);
    if (ids.length) {
      const { count } = await supabase
        .from("scholarship_applications")
        .select("*", { count: "exact", head: true })
        .in("student_id", ids);
      if ((count ?? 0) > 0) {
        blocking.push({ key: "scholarships", label: "Scholarships", count: count ?? 0 });
      }

      const { count: docCount } = await supabase
        .from("student_documents")
        .select("*", { count: "exact", head: true })
        .in("student_id", ids);
      if ((docCount ?? 0) > 0) {
        blocking.push({ key: "student_documents", label: "Documents", count: docCount ?? 0 });
      }
    }
  }

  for (const probe of probes) {
    if (blocking.some((b) => b.key === probe.key)) continue;
    const count = await countEq(supabase, probe.table, probe.column ?? "family_id", familyId);
    if (count > 0) blocking.push({ key: probe.key, label: probe.label, count });
  }

  // Invoices via billing account
  const { data: account } = await supabase
    .from("family_billing_accounts")
    .select("id")
    .eq("family_id", familyId)
    .maybeSingle();
  if (account?.id) {
    const invoiceCount = await countEq(supabase, "invoices", "billing_account_id", account.id);
    if (invoiceCount > 0 && !blocking.some((b) => b.key === "billing")) {
      blocking.push({ key: "billing", label: "Billing / invoices", count: invoiceCount });
    }
  }

  return {
    familyId,
    blocking,
    canDelete: blocking.length === 0,
  };
}
