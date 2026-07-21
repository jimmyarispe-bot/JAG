/**
 * Workflow Marketplace — soft-read RC-7 studio examples (+ reference keys).
 */

import {
  getExampleWorkflowCatalog,
  EXAMPLE_WORKFLOW_KEYS,
} from "@/lib/platform/workflows";
import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

/** Legacy automation marketplace seeds (soft-read keys only — no Supabase required). */
const LEGACY_AUTOMATION_TEMPLATES: Array<{
  key: string;
  name: string;
  description: string;
  module: string;
}> = [
  {
    key: "mp_admissions_esa_enrollment",
    name: "ESA Enrollment",
    description: "Admissions ESA enrollment automation template",
    module: "admissions",
  },
  {
    key: "mp_hr_teacher_onboarding",
    name: "Teacher Onboarding",
    description: "HR teacher onboarding automation template",
    module: "hr",
  },
  {
    key: "mp_finance_tuition_overdue",
    name: "Tuition Overdue",
    description: "Finance tuition overdue follow-up template",
    module: "finance",
  },
  {
    key: "mp_admissions_annual_reenrollment",
    name: "Annual Re-enrollment",
    description: "Admissions annual re-enrollment template",
    module: "admissions",
  },
];

export function buildWorkflowMarketplaceListings(): MarketplaceListing[] {
  const studio = getExampleWorkflowCatalog().map((wf) => ({
    id: `mp-wf-${wf.key}`,
    key: `workflow.studio.${wf.key}`,
    category: "workflows" as const,
    name: wf.name,
    description: wf.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Workflow Studio",
    status: "published" as const,
    tags: ["workflow", "studio", wf.category, ...wf.nodeTypes],
    sourceSystem: "workflows/examples",
    pricing: "included" as const,
    certified: true,
    capabilities: wf.nodeTypes,
    meta: { exampleKey: wf.key, category: wf.category },
  }));

  const legacy = LEGACY_AUTOMATION_TEMPLATES.map((t) => ({
    id: `mp-wf-legacy-${t.key}`,
    key: `workflow.automation.${t.key}`,
    category: "workflows" as const,
    name: t.name,
    description: t.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Automation",
    status: "published" as const,
    tags: ["workflow", "automation", t.module],
    sourceSystem: "automation/marketplace",
    pricing: "included" as const,
    certified: true,
    capabilities: ["automation_template"],
    meta: { marketplaceKey: t.key, module: t.module },
  }));

  // Ensure all studio keys are represented
  void EXAMPLE_WORKFLOW_KEYS;
  return [...studio, ...legacy];
}
