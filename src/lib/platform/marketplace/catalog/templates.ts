/**
 * Templates Marketplace — org/config/studio starter templates (soft-read defs).
 */

import { EXAMPLE_WORKFLOW_KEYS } from "@/lib/platform/workflows";
import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const ORG_TEMPLATES: Array<{
  key: string;
  name: string;
  description: string;
  tags: string[];
}> = [
  {
    key: "academy_startup",
    name: "Academy Startup Template",
    description: "Starter org template with admissions, SIS, and school-leader ECC layout.",
    tags: ["education", "startup"],
  },
  {
    key: "multi_campus",
    name: "Multi-Campus Network Template",
    description: "Multi-school template with federation-ready dashboards and governance pack.",
    tags: ["network", "governance"],
  },
  {
    key: "nonprofit_ops",
    name: "Nonprofit Ops Template",
    description: "Finance + HR + grants-oriented organization template.",
    tags: ["nonprofit", "finance"],
  },
];

export function buildTemplateMarketplaceListings(): MarketplaceListing[] {
  const org = ORG_TEMPLATES.map((t) => ({
    id: `mp-tpl-${t.key}`,
    key: `template.org.${t.key}`,
    category: "templates" as const,
    name: t.name,
    description: t.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Configuration",
    status: "published" as const,
    tags: ["template", "organization", ...t.tags],
    sourceSystem: "marketplace/templates",
    pricing: "included" as const,
    certified: true,
    capabilities: ["org_bootstrap"],
    meta: { templateKey: t.key },
  }));

  const workflowTpl = EXAMPLE_WORKFLOW_KEYS.map((key) => ({
    id: `mp-tpl-wf-${key}`,
    key: `template.workflow.${key}`,
    category: "templates" as const,
    name: `Workflow Template · ${key}`,
    description: `Installable studio workflow template for ${key}.`,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Workflow Studio",
    status: "published" as const,
    tags: ["template", "workflow", key],
    sourceSystem: "workflows/examples",
    pricing: "included" as const,
    certified: true,
    capabilities: ["workflow_install"],
    dependencies: [`workflow.studio.${key}`],
    meta: { exampleKey: key },
  }));

  return [...org, ...workflowTpl];
}
