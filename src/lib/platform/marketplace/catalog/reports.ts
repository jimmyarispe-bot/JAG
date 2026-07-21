/**
 * Reports Marketplace — curated executive / ops report templates (soft-read defs).
 */

import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

const REPORTS: Array<{
  key: string;
  name: string;
  description: string;
  tags: string[];
  capabilities: string[];
}> = [
  {
    key: "board_risk_summary",
    name: "Board Risk Summary",
    description: "Monthly board-ready risk rollup from Mission Control Risk Center soft-reads.",
    tags: ["board", "risk", "executive"],
    capabilities: ["risk_center", "board_prep"],
  },
  {
    key: "cash_runway",
    name: "Cash & Runway Report",
    description: "Finance soft-read report covering cash, burn, and runway.",
    tags: ["finance", "cash"],
    capabilities: ["finance_feed", "digital_twin"],
  },
  {
    key: "pipeline_health",
    name: "Pipeline Health Report",
    description: "CRM pipeline health, forecast, and concentration soft-read report.",
    tags: ["crm", "revenue"],
    capabilities: ["crm_feed", "sales_forecast"],
  },
  {
    key: "workforce_capacity",
    name: "Workforce Capacity Report",
    description: "HR headcount, turnover, and capacity gap soft-read report.",
    tags: ["hr", "capacity"],
    capabilities: ["hr_feed"],
  },
  {
    key: "student_health",
    name: "Student Health Report",
    description: "Education soft-read report for student health and attendance.",
    tags: ["education", "students"],
    capabilities: ["education_feed"],
  },
  {
    key: "collaboration_silos",
    name: "Collaboration Silos Report",
    description: "Communication health and silo detection from collaboration ECC widgets.",
    tags: ["collaboration", "silos"],
    capabilities: ["communication_health"],
  },
  {
    key: "initiative_portfolio",
    name: "Initiative Portfolio Report",
    description: "Initiative monitor + portfolio health soft-read report.",
    tags: ["initiatives", "portfolio"],
    capabilities: ["initiative_monitor", "portfolio_health"],
  },
];

export function buildReportMarketplaceListings(): MarketplaceListing[] {
  return REPORTS.map((r) => ({
    id: `mp-report-${r.key}`,
    key: `report.${r.key}`,
    category: "reports" as const,
    name: r.name,
    description: r.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Reporting",
    status: "published" as const,
    tags: ["report", ...r.tags],
    sourceSystem: "marketplace/reports",
    pricing: "included" as const,
    certified: true,
    capabilities: r.capabilities,
    meta: { reportKey: r.key },
  }));
}
