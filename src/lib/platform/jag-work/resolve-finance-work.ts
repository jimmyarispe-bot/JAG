import { buildJagWorkQueue } from "@/lib/platform/jag-work/build-queue";
import { FINANCE_WORK_PERSPECTIVES } from "@/lib/platform/jag-work/perspectives";
import type { JagWorkItem, JagWorkQueue, ResolveFinanceJagWorkInput } from "@/lib/platform/jag-work/types";
import { resolveObjectOrganizationalOwner } from "@/lib/platform/jag-organization";

function orgOwnerLabel(input: ResolveFinanceJagWorkInput): string | undefined {
  const org = input.executionState?.org;
  if (!org) return undefined;
  return resolveObjectOrganizationalOwner(org, "budget", "finance-queue").owner.name;
}

function buildInvoiceWorkItems(input: ResolveFinanceJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);
  const today = new Date().toISOString().split("T")[0]!;
  const knowledgeKeys = input.executionState?.knowledge.slice(0, 2).map((k) => k.nodeKey) ?? [];

  return input.invoices
    .filter((inv) => !["paid", "void", "cancelled"].includes(inv.invoice_status))
    .map((inv) => {
      const family = inv.family_billing_accounts?.families?.family_name ?? "Family";
      const student = inv.students
        ? `${inv.students.first_name} ${inv.students.last_name}`.trim()
        : undefined;
      const outstanding = inv.total_amount - inv.amount_paid;
      const overdue = inv.due_date < today;
      const perspectives: string[] = ["today"];
      if (overdue) perspectives.push("collections_due", "highest_priorities", "needs_human_decision");
      if (inv.invoice_status === "pending_approval") perspectives.push("awaiting_review", "ready_to_post");
      if (!overdue && inv.invoice_status === "draft") perspectives.push("ready_to_post");

      return {
        id: `invoice-${inv.id}`,
        title: `Invoice ${inv.invoice_number} — ${family}`,
        description: student ? `${student} · $${outstanding.toFixed(2)} due` : `$${outstanding.toFixed(2)} outstanding`,
        workType: "invoice",
        perspectives: [...new Set(perspectives)],
        priority: overdue ? "critical" : outstanding > 1000 ? "high" : "medium",
        ownerLabel: owner,
        dueDate: inv.due_date,
        status: overdue ? "blocked" : inv.invoice_status === "pending_approval" ? "awaiting_review" : "in_progress",
        requiredCapabilityKey: "cap.finance.billing_operations",
        requiredKnowledgeKeys: knowledgeKeys,
        requiredEvidenceTypes: [],
        recommendedNextAction: overdue
          ? "Contact family and initiate collections workflow"
          : inv.invoice_status === "draft"
            ? "Review and post invoice"
            : "Record payment or follow up",
        blockingDependencies: overdue ? ["Payment past due date"] : [],
        completionCriteria: ["Invoice paid or payment plan established"],
        href: `/dashboard/finance?view=invoices`,
        entityType: "invoices",
        entityId: inv.id,
        studentName: student,
        source: "finance",
      };
    });
}

function buildCollectionsWorkItems(input: ResolveFinanceJagWorkInput): JagWorkItem[] {
  const owner = orgOwnerLabel(input);

  return input.billingAccounts
    .filter((a) => (a.collections_status && a.collections_status !== "none") || a.balance > 0)
    .filter((a) => a.collections_status === "active" || a.balance > 500)
    .map((account) => ({
      id: `collections-${account.id}`,
      title: `Collections — ${account.families?.family_name ?? "Account"}`,
      description: `Balance $${account.balance.toFixed(2)}`,
      workType: "collections",
      perspectives: ["collections_due", "highest_priorities", "needs_human_decision"],
      priority: account.balance > 2000 ? "critical" : "high",
      ownerLabel: owner,
      status: "blocked" as const,
      requiredCapabilityKey: "cap.finance.billing_operations",
      requiredKnowledgeKeys: [],
      requiredEvidenceTypes: [],
      recommendedNextAction: "Review account and execute collections protocol",
      blockingDependencies: ["Outstanding balance"],
      completionCriteria: ["Collections status resolved", "Payment received or plan active"],
      href: `/dashboard/finance?view=accounts`,
      entityType: "family_billing_accounts",
      entityId: account.id,
      source: "finance" as const,
    }));
}

function buildEngineWorkItems(input: ResolveFinanceJagWorkInput): JagWorkItem[] {
  return input.engineRecommendations.map((rec) => ({
    id: `engine-${rec.id}`,
    title: rec.title,
    description: rec.rationale,
    workType: "engine_recommendation",
    perspectives: ["needs_human_decision", "awaiting_review"],
    priority: rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium",
    status: "awaiting_review" as const,
    requiredKnowledgeKeys: [],
    requiredEvidenceTypes: [],
    recommendedNextAction: rec.rationale,
    blockingDependencies: [],
    completionCriteria: ["Recommendation acknowledged"],
    href: "/dashboard/finance?work=needs_human_decision",
    source: "execution_engine" as const,
  }));
}

export function resolveFinanceJagWork(input: ResolveFinanceJagWorkInput): JagWorkQueue {
  return buildJagWorkQueue(
    "finance",
    FINANCE_WORK_PERSPECTIVES,
    [
      ...buildInvoiceWorkItems(input),
      ...buildCollectionsWorkItems(input),
      ...buildEngineWorkItems(input),
    ],
    input.activePerspective
  );
}
