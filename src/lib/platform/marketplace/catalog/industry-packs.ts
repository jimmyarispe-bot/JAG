/**
 * Industry Packs — curated bundles across connectors, workflows, and dashboards.
 */

import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const PACKS: Array<{
  key: string;
  name: string;
  description: string;
  tags: string[];
  dependencies: string[];
  capabilities: string[];
}> = [
  {
    key: "k12_academy",
    name: "K-12 Academy Pack",
    description:
      "Education connectors, student enrollment workflow, school-leader dashboard, and scholarship approval.",
    tags: ["education", "k12", "admissions"],
    dependencies: [
      "connector.canvas",
      "connector.powerschool",
      "workflow.studio.student_enrollment",
      "workflow.studio.scholarship_approval",
      "dashboard.ecc.school_leader",
    ],
    capabilities: ["enrollment", "scholarships", "attendance"],
  },
  {
    key: "nonprofit_finance",
    name: "Nonprofit Finance Pack",
    description:
      "Finance connectors, budget/purchase approvals, grant renewal, and CFO-oriented mission control.",
    tags: ["finance", "nonprofit", "grants"],
    dependencies: [
      "connector.quickbooks",
      "connector.stripe",
      "connector.plaid",
      "workflow.studio.budget_approval",
      "workflow.studio.grant_renewal",
      "dashboard.mission_control.risk_center",
    ],
    capabilities: ["cash", "grants", "approvals"],
  },
  {
    key: "people_ops",
    name: "People Operations Pack",
    description: "HR connectors, employee onboarding workflow, and workforce dashboards.",
    tags: ["hr", "people", "onboarding"],
    dependencies: [
      "connector.gusto",
      "connector.bamboohr",
      "workflow.studio.employee_onboarding",
      "dashboard.ecc.ceo",
    ],
    capabilities: ["onboarding", "payroll", "capacity"],
  },
  {
    key: "revenue_growth",
    name: "Revenue Growth Pack",
    description: "CRM connectors, lead follow-up workflow, pipeline dashboards, and AI revenue agent.",
    tags: ["crm", "revenue", "sales"],
    dependencies: [
      "connector.hubspot",
      "connector.salesforce",
      "workflow.studio.lead_follow_up",
      "ai_agent.revenue_decline",
      "dashboard.ecc.ceo",
    ],
    capabilities: ["pipeline", "forecast", "lead_follow_up"],
  },
  {
    key: "governance_board",
    name: "Board Governance Pack",
    description: "Board dashboard, contract/vendor approvals, and board-prep AI agent.",
    tags: ["governance", "board", "compliance"],
    dependencies: [
      "dashboard.ecc.board",
      "workflow.studio.contract_review",
      "workflow.studio.vendor_approval",
      "ai_agent.board_prep",
      "report.board_risk_summary",
    ],
    capabilities: ["board", "approvals", "risk"],
  },
];

export function buildIndustryPackListings(): MarketplaceListing[] {
  return PACKS.map((p) => ({
    id: `mp-pack-${p.key}`,
    key: `industry_pack.${p.key}`,
    category: "industry_packs" as const,
    name: p.name,
    description: p.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Industry Solutions",
    status: "published" as const,
    tags: ["industry_pack", ...p.tags],
    sourceSystem: "marketplace/industry-packs",
    pricing: "included" as const,
    certified: true,
    dependencies: p.dependencies,
    capabilities: p.capabilities,
    meta: { packKey: p.key },
  }));
}
