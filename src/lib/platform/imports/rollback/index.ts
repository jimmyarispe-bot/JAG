import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  getImportJob,
  getJobTransactions,
  markTransactionsRolledBack,
  updateImportJob,
} from "../jobs";
import type { RollbackResult } from "../types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Roll back an entire import transaction.
 * Deletes entities created by the import in reverse dependency order.
 */
export async function rollbackImportJob(
  supabase: AuthClient,
  jobId: string
): Promise<RollbackResult> {
  const job = await getImportJob(supabase, jobId);
  if (!job) return { jobId, rolledBackEntities: 0, errors: ["Import job not found"] };
  if (job.status === "rolled_back") {
    return { jobId, rolledBackEntities: 0, errors: ["Import already rolled back"] };
  }
  if (job.status !== "completed" && job.status !== "failed") {
    return { jobId, rolledBackEntities: 0, errors: ["Only completed or failed imports can be rolled back"] };
  }

  const transactions = await getJobTransactions(supabase, jobId);
  const active = transactions.filter((t) => !t.rolled_back && t.action === "created");
  const errors: string[] = [];
  const rolledIds: string[] = [];

  // Dependency-safe order: guardians → students → families → enrollments/funding already cascade via student delete where possible
  const order = ["guardian", "sis_enrollment", "student_funding", "student", "family"];
  const sorted = [...active].sort((a, b) => {
    const ai = order.indexOf(a.entity_type);
    const bi = order.indexOf(b.entity_type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const tx of sorted) {
    try {
      if (tx.entity_type === "guardian") {
        const { error } = await supabase.from("guardians").delete().eq("id", tx.entity_id);
        if (error) throw new Error(error.message);
      } else if (tx.entity_type === "sis_enrollment") {
        const { error } = await supabase.from("sis_enrollments").delete().eq("id", tx.entity_id);
        if (error) throw new Error(error.message);
      } else if (tx.entity_type === "student") {
        const { error } = await supabase.from("students").delete().eq("id", tx.entity_id);
        if (error) throw new Error(error.message);
      } else if (tx.entity_type === "family") {
        // Only delete family if no remaining students
        const { count } = await supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("family_id", tx.entity_id);
        if ((count ?? 0) === 0) {
          const { error } = await supabase.from("families").delete().eq("id", tx.entity_id);
          if (error) throw new Error(error.message);
        }
      } else if (tx.entity_type === "student_funding") {
        // Junction rows cascade with student deletes; nothing to do by entity id.
      }
      rolledIds.push(tx.id);
    } catch (err) {
      errors.push(
        `${tx.entity_type}:${tx.entity_id} — ${err instanceof Error ? err.message : "rollback failed"}`
      );
    }
  }

  await markTransactionsRolledBack(supabase, rolledIds);
  await updateImportJob(supabase, jobId, {
    status: "rolled_back",
    completedAt: new Date().toISOString(),
    metadata: {
      ...job.metadata,
      rollbackAt: new Date().toISOString(),
      rollbackErrors: errors,
    },
  });

  return { jobId, rolledBackEntities: rolledIds.length, errors };
}
