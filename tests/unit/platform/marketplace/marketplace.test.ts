/** RC-8 — Unified Marketplace unit tests. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  MARKETPLACE_VERSION,
  MARKETPLACE_CATEGORIES,
  createMarketplaceEngine,
  buildMarketplaceCatalogSnapshot,
  searchMarketplace,
  installMarketplaceItem,
  marketplaceInstallStore,
  assembleMarketplaceSoftContext,
  getMarketplaceListing,
} from "@/lib/platform/marketplace";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  registerHrPlatformConnectors,
  registerFinancePlatformConnectors,
  crmStore,
  hrStore,
  financeStore,
} from "@/lib/platform/integrations";
import {
  rebuildUnifiedKnowledgeGraph,
  unifiedGraphStore,
} from "@/lib/platform/knowledge-graph";

describe("RC-8 — Marketplace", () => {
  beforeEach(() => {
    marketplaceInstallStore.clear();
    crmStore.clear();
    hrStore.clear();
    financeStore.clear();
    unifiedGraphStore.clear();
  });

  async function seedOrg(org = "org-marketplace-demo") {
    const platform = createIntegrationPlatformCore();
    registerCrmPlatformConnectors(platform);
    registerHrPlatformConnectors(platform);
    registerFinancePlatformConnectors(platform);
    for (const id of [`hubspot-${org}`, `gusto-${org}`, `stripe-${org}`]) {
      platform.lifecycle.seed(id, "connected");
    }
    await platform.syncNow("hubspot", `hubspot-${org}`, "full");
    await platform.syncNow("gusto", `gusto-${org}`, "full");
    await platform.syncNow("stripe", `stripe-${org}`, "full");
    rebuildUnifiedKnowledgeGraph(org);
    return org;
  }

  it("exports version and all nine marketplace categories", () => {
    expect(MARKETPLACE_VERSION).toBe("1.0.0");
    expect(MARKETPLACE_CATEGORIES).toEqual([
      "connectors",
      "workflows",
      "dashboards",
      "industry_packs",
      "ai_agents",
      "reports",
      "templates",
      "sdk_extensions",
      "plugins",
    ]);
  });

  it("builds a catalog covering every category", () => {
    const snap = buildMarketplaceCatalogSnapshot(
      () => new Date("2026-07-19T12:00:00.000Z")
    );
    expect(snap.version).toBe("1.0.0");
    expect(snap.totalListings).toBeGreaterThan(40);
    for (const cat of MARKETPLACE_CATEGORIES) {
      expect(snap.totals[cat], cat).toBeGreaterThan(0);
      expect(snap.categories[cat].length).toBe(snap.totals[cat]);
    }
    expect(snap.categories.connectors.some((c) => c.key === "connector.hubspot")).toBe(
      true
    );
    expect(
      snap.categories.workflows.some((w) => w.key === "workflow.studio.employee_onboarding")
    ).toBe(true);
    expect(snap.categories.dashboards.some((d) => d.key.includes("mission_control"))).toBe(
      true
    );
    expect(snap.categories.industry_packs.length).toBeGreaterThanOrEqual(5);
    expect(snap.categories.ai_agents.length).toBeGreaterThan(5);
    expect(snap.categories.plugins.some((p) => p.key.startsWith("plugin."))).toBe(true);
  });

  it("searches by category, query, and certified flag", () => {
    const connectors = searchMarketplace({ category: "connectors", limit: 50 });
    expect(connectors.total).toBeGreaterThan(10);
    expect(connectors.items.every((i) => i.category === "connectors")).toBe(true);

    const hubspot = searchMarketplace({ q: "hubspot" });
    expect(hubspot.items.some((i) => i.key === "connector.hubspot")).toBe(true);

    const certified = searchMarketplace({ certifiedOnly: true, category: "plugins" });
    expect(certified.items.every((i) => i.certified)).toBe(true);
  });

  it("installs listings as intent only (no auto-execute)", () => {
    const result = installMarketplaceItem({
      organizationId: "org-1",
      listingKey: "connector.stripe",
      installedBy: "tester",
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });
    expect(result.ok).toBe(true);
    expect(result.governance.mayAutoExecute).toBe(false);
    expect(result.governance.vendorApisForbidden).toBe(true);
    expect(result.record?.status).toBe("installed");
    expect(marketplaceInstallStore.list("org-1")).toHaveLength(1);
  });

  it("installs industry packs with dependency intents", () => {
    const pack = getMarketplaceListing("industry_pack.people_ops");
    expect(pack?.dependencies?.length).toBeGreaterThan(0);

    const result = installMarketplaceItem({
      organizationId: "org-pack",
      listingKey: "industry_pack.people_ops",
      includeDependencies: true,
    });
    expect(result.ok).toBe(true);
    const installs = marketplaceInstallStore.list("org-pack");
    expect(installs.length).toBeGreaterThan(1);
    expect(installs.some((i) => i.listingKey === "industry_pack.people_ops")).toBe(true);
    expect(installs.some((i) => i.listingKey === "connector.gusto")).toBe(true);
  });

  it("engine facade + soft-read recommendations", async () => {
    const org = await seedOrg();
    const engine = createMarketplaceEngine();
    expect(engine.version).toBe("1.0.0");
    expect(engine.listCategories()).toHaveLength(9);
    expect(engine.snapshot().totalListings).toBeGreaterThan(40);

    engine.install({
      organizationId: org,
      listingKey: "ai_agent.organizational_risks",
    });

    const ctx = assembleMarketplaceSoftContext(org);
    expect(ctx.domainsPresent).toEqual(
      expect.arrayContaining(["knowledge-graph", "finance", "crm", "hr"])
    );
    expect(ctx.installs.length).toBe(1);
    expect(ctx.recommendedKeys.length).toBeGreaterThan(0);

    const installedOnly = engine.search({
      organizationId: org,
      installedOnly: true,
    });
    expect(installedOnly.items.some((i) => i.key === "ai_agent.organizational_risks")).toBe(
      true
    );
  });
});
