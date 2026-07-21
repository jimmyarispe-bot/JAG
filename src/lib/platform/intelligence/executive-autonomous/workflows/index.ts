import { complianceWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/compliance";
import { enrollmentWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/enrollment";
import { financeWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/finance";
import { grantsWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/grants";
import { operationsWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/operations";
import { staffingWorkflow } from "@/lib/platform/intelligence/executive-autonomous/workflows/staffing";
import type {
  WorkflowKind,
  WorkflowTemplate,
} from "@/lib/platform/intelligence/executive-autonomous/types";

const TEMPLATES: Record<WorkflowKind, WorkflowTemplate> = {
  staffing: staffingWorkflow,
  finance: financeWorkflow,
  enrollment: enrollmentWorkflow,
  compliance: complianceWorkflow,
  grants: grantsWorkflow,
  operations: operationsWorkflow,
};

export function listWorkflowTemplates(): WorkflowTemplate[] {
  return Object.values(TEMPLATES);
}

export function getWorkflowTemplate(kind: WorkflowKind): WorkflowTemplate {
  return TEMPLATES[kind];
}

export function resolveWorkflowKind(input: {
  category?: string;
  issueKind?: string;
  title?: string;
  domains?: string[];
}): WorkflowKind {
  const hay = [
    input.category,
    input.issueKind,
    input.title,
    ...(input.domains ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/grant|funding opportunity|award/.test(hay)) return "grants";
  if (/hire|staff|teacher|vacanc|fte|recruit/.test(hay)) return "staffing";
  if (/enroll|admission|inquiry|conversion|campaign/.test(hay)) return "enrollment";
  if (/budget|cash|tuition|financ|invoice|revenue/.test(hay)) return "finance";
  if (/complian|audit|policy|regulat|finding/.test(hay)) return "compliance";
  return "operations";
}

export {
  staffingWorkflow,
  financeWorkflow,
  enrollmentWorkflow,
  complianceWorkflow,
  grantsWorkflow,
  operationsWorkflow,
};
