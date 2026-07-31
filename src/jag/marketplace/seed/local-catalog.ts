/**
 * Seed the local Marketplace registry with known JAG ecosystem artifacts.
 *
 * Foundation packs are represented as SDK-built marketplace stubs (correct ids,
 * versions, and dependency edges). This keeps `src/jag` free of `@/packages/*`
 * imports while still exercising install / resolve workflows.
 *
 * Full production pack payloads remain owned by `src/packages/*` and are
 * attached by Organization Blueprints at composition time.
 */

import {
  EducationIndustryBlueprint,
  GovernmentIndustryBlueprint,
  HealthcareIndustryBlueprint,
  ManufacturingIndustryBlueprint,
} from "@/jag/blueprints";
import { buildMarketplaceArtifact } from "@/jag/marketplace/artifact-factory";
import type { LocalMarketplaceRegistry } from "@/jag/marketplace/registry/local-registry";
import { getDefaultMarketplaceRegistry } from "@/jag/marketplace/registry/local-registry";
import { buildCapabilityPack } from "@/jag/sdk/builders";
import { exampleAssetManagementPack } from "@/jag/sdk/examples/sample-capability-pack";
import { exampleNonprofitIndustryBlueprint } from "@/jag/sdk/examples/sample-industry";
import { buildExampleCommunityFoundationOrganization } from "@/jag/sdk/examples/sample-organization";

const FOUNDATION_PACK_DEPS = Object.freeze([
  Object.freeze({ id: "identity.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "documents.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "communications.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "scheduling.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "work.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "decision.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "policy.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "reporting.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "analytics.core", versionRange: "^1.0.0" }),
]);

/** Healthcare install example graph (marketplace deps — not industry config pack ids). */
const HEALTHCARE_INSTALL_DEPS = Object.freeze([
  Object.freeze({ id: "identity.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "policy.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "reporting.core", versionRange: "^1.0.0" }),
  Object.freeze({ id: "analytics.core", versionRange: "^1.0.0" }),
]);

type FoundationSeed = {
  readonly id: string;
  readonly label: string;
  readonly module: string;
  readonly dependencies?: readonly {
    readonly id: string;
    readonly versionRange: string;
    readonly optional?: boolean;
  }[];
};

const FOUNDATION_SEEDS: readonly FoundationSeed[] = Object.freeze([
  Object.freeze({ id: "identity.core", label: "Identity", module: "identity" }),
  Object.freeze({
    id: "documents.core",
    label: "Documents",
    module: "documents",
  }),
  Object.freeze({
    id: "communications.core",
    label: "Communications",
    module: "communications",
  }),
  Object.freeze({
    id: "scheduling.core",
    label: "Scheduling",
    module: "scheduling",
  }),
  Object.freeze({ id: "work.core", label: "Work", module: "work" }),
  Object.freeze({ id: "decision.core", label: "Decision", module: "decision" }),
  Object.freeze({ id: "policy.core", label: "Policy", module: "policy" }),
  Object.freeze({
    id: "reporting.core",
    label: "Reporting",
    module: "reporting",
    dependencies: Object.freeze([
      Object.freeze({ id: "identity.core", versionRange: "^1.0.0", optional: true }),
    ]),
  }),
  Object.freeze({
    id: "analytics.core",
    label: "Analytics",
    module: "analytics",
    dependencies: Object.freeze([
      Object.freeze({ id: "reporting.core", versionRange: "^1.0.0" }),
    ]),
  }),
]);

function registerFoundationPacks(registry: LocalMarketplaceRegistry): void {
  for (const seed of FOUNDATION_SEEDS) {
    const pack = buildCapabilityPack({
      id: seed.id,
      label: seed.label,
      version: "1.0.0",
      description: `${seed.label} foundation capability pack (marketplace stub).`,
      publisher: "The JAG™",
      modules: Object.freeze([seed.module]),
      status: "draft",
      dependencies: (seed.dependencies ?? []).map((d) =>
        Object.freeze({
          packId: d.id,
          versionRange: d.versionRange,
          optional: d.optional,
        })
      ),
      tags: Object.freeze(["foundation", "capability-pack", "marketplace-stub"]),
    });

    registry.register(
      buildMarketplaceArtifact({
        id: seed.id,
        name: seed.label,
        version: "1.0.0",
        author: "JAG",
        license: "UNLICENSED",
        description: pack.description ?? seed.label,
        dependencies: seed.dependencies ?? [],
        tags: Object.freeze(["foundation", "capability-pack"]),
        trustLevel: "official",
        metadata: Object.freeze({
          category: "foundation",
          maturity: "stable" as const,
          supportedLocales: Object.freeze(["en"]),
          releaseNotes: `${seed.id} marketplace registry stub`,
        }),
        payload: { kind: "capability-pack", pack },
      })
    );
  }
}

function registerIndustries(registry: LocalMarketplaceRegistry): void {
  const industries = [
    {
      industry: EducationIndustryBlueprint,
      deps: FOUNDATION_PACK_DEPS,
      releaseNotes: "Education Industry Blueprint v2",
    },
    {
      industry: HealthcareIndustryBlueprint,
      deps: HEALTHCARE_INSTALL_DEPS,
      releaseNotes: "Healthcare Industry Blueprint v1",
    },
    {
      industry: ManufacturingIndustryBlueprint,
      deps: FOUNDATION_PACK_DEPS,
      releaseNotes: "Manufacturing Industry Blueprint v1",
    },
    {
      industry: GovernmentIndustryBlueprint,
      deps: FOUNDATION_PACK_DEPS,
      releaseNotes: "Government Industry Blueprint v1",
    },
    {
      industry: exampleNonprofitIndustryBlueprint,
      marketplaceId: "nonprofit",
      deps: Object.freeze([
        Object.freeze({ id: "identity.core", versionRange: "^1.0.0" }),
        Object.freeze({
          id: "asset-management.example",
          versionRange: "^1.0.0",
          optional: true,
        }),
      ]),
      releaseNotes: "SDK example Nonprofit industry",
    },
  ] as const;

  for (const row of industries) {
    const industry = row.industry;
    const marketplaceId =
      "marketplaceId" in row && row.marketplaceId
        ? row.marketplaceId
        : industry.id;
    const isExample =
      marketplaceId === "nonprofit" || industry.id.includes("example");
    registry.register(
      buildMarketplaceArtifact({
        id: marketplaceId,
        name: industry.label,
        version: industry.version,
        author: "JAG",
        license: "UNLICENSED",
        description: industry.description ?? industry.label,
        dependencies: row.deps,
        tags: Object.freeze([
          ...(industry.tags ?? []),
          "industry-blueprint",
        ]),
        trustLevel: isExample ? "community" : "official",
        metadata: Object.freeze({
          category: "industry",
          industry: industry.id,
          maturity: isExample
            ? ("experimental" as const)
            : ("stable" as const),
          supportedLocales: Object.freeze(["en"]),
          releaseNotes: row.releaseNotes,
        }),
        payload: { kind: "industry-blueprint", industry },
      })
    );
  }
}

function registerSdkExamples(registry: LocalMarketplaceRegistry): void {
  registry.register(
    buildMarketplaceArtifact({
      id: exampleAssetManagementPack.id,
      name: exampleAssetManagementPack.label,
      version: exampleAssetManagementPack.version ?? "1.0.0",
      author: "JAG SDK Examples",
      license: "UNLICENSED",
      description:
        exampleAssetManagementPack.description ??
        exampleAssetManagementPack.label,
      dependencies: Object.freeze([
        Object.freeze({
          id: "identity.core",
          versionRange: "^1.0.0",
          optional: true,
        }),
      ]),
      tags: Object.freeze(["sdk-example", "capability-pack"]),
      trustLevel: "community",
      metadata: Object.freeze({
        category: "extension",
        maturity: "experimental" as const,
        supportedLocales: Object.freeze(["en"]),
        releaseNotes: "SDK example capability pack",
      }),
      payload: {
        kind: "capability-pack",
        pack: exampleAssetManagementPack,
      },
    })
  );

  const orgBuilt = buildExampleCommunityFoundationOrganization();
  if (orgBuilt.ok && orgBuilt.organization) {
    const org = orgBuilt.organization;
    registry.register(
      buildMarketplaceArtifact({
        id: org.id,
        name: org.displayName,
        version: org.version,
        author: "JAG SDK Examples",
        license: "UNLICENSED",
        description: org.description ?? org.displayName,
        dependencies: Object.freeze([
          Object.freeze({
            id: "nonprofit",
            versionRange: "^1.0.0",
          }),
          Object.freeze({
            id: "asset-management.example",
            versionRange: "^1.0.0",
          }),
        ]),
        tags: Object.freeze(["sdk-example", "organization-blueprint"]),
        trustLevel: "community",
        metadata: Object.freeze({
          category: "organization",
          industry: "nonprofit",
          maturity: "experimental" as const,
          supportedLocales: Object.freeze(["en"]),
          releaseNotes: "SDK example organization overlay",
        }),
        payload: { kind: "organization-blueprint", organization: org },
      })
    );
  }
}

/**
 * Populate a registry with the local Marketplace catalog.
 */
export function seedLocalMarketplaceCatalog(
  registry: LocalMarketplaceRegistry = getDefaultMarketplaceRegistry()
): LocalMarketplaceRegistry {
  registerFoundationPacks(registry);
  registerIndustries(registry);
  registerSdkExamples(registry);
  return registry;
}
