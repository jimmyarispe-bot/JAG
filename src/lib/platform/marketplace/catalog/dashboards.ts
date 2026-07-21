/**
 * Dashboard Marketplace — soft-read ECC layouts + Mission Control panels.
 */

import { listLayouts } from "@/lib/platform/intelligence/executive-command-center/layouts";
import { MISSION_CONTROL_PANELS } from "@/lib/platform/executive-command-center";
import type { MarketplaceListing } from "@/lib/platform/marketplace/types";
import { MARKETPLACE_VERSION } from "@/lib/platform/marketplace/types";

export function buildDashboardMarketplaceListings(): MarketplaceListing[] {
  const layouts = listLayouts().map((layout) => ({
    id: `mp-dash-${layout.role}`,
    key: `dashboard.ecc.${layout.role}`,
    category: "dashboards" as const,
    name: `${layout.label} Command Center`,
    description: layout.description,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Executive Command Center",
    status: "certified" as const,
    tags: ["dashboard", "ecc", layout.role, "executive"],
    sourceSystem: "intelligence/executive-command-center/layouts",
    pricing: "included" as const,
    certified: true,
    capabilities: layout.widgetOrder.slice(0, 12),
    meta: { role: layout.role, widgetCount: layout.widgetOrder.length },
  }));

  const missionPanels = MISSION_CONTROL_PANELS.map((panel) => ({
    id: `mp-dash-mc-${panel}`,
    key: `dashboard.mission_control.${panel}`,
    category: "dashboards" as const,
    name: panel
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    description: `Mission Control panel: ${panel}`,
    version: MARKETPLACE_VERSION,
    publisher: "JAG Mission Control",
    status: "published" as const,
    tags: ["dashboard", "mission_control", panel],
    sourceSystem: "executive-command-center",
    pricing: "included" as const,
    certified: true,
    capabilities: [panel],
    meta: { panelId: panel },
  }));

  return [...layouts, ...missionPanels];
}
