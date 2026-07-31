/**
 * Sprint 006 — Canonical ownership registry.
 * Single source of truth for which implementation owns each universal capability.
 * Legacy code is not deleted this sprint; it is classified here.
 */

export type CanonicalCapabilityStatus =
  | "canonical"
  | "reexport"
  | "stub"
  | "legacy-compat"
  | "different-capability";

export type CanonicalOwnerRecord = {
  readonly capability: string;
  readonly canonicalImport: string;
  readonly implementation: string;
  readonly status: CanonicalCapabilityStatus;
  readonly legacy?: readonly string[];
  readonly retirement?: string;
  readonly notes?: string;
};

/**
 * Every universal capability has exactly one canonical owner for new work.
 * Do not add parallel engines — extend or shim to these owners.
 */
export const JAG_CANONICAL_OWNERS = [
  {
    capability: "runtime",
    canonicalImport: "@/jag/runtime",
    implementation: "src/jag/runtime",
    status: "canonical",
    legacy: ["@/applications/academyos/composition/bootstrap#startAcademyOS"],
    retirement:
      "Remove Academy DI service bridge when multi-package resolve exists",
    notes:
      "startJAG loads packages via PackageLoader + JagPackageHost; startAcademyOS delegates",
  },

  {
    capability: "workflows",
    canonicalImport: "@/jag/workflows",
    implementation: "src/lib/platform/workflows/framework",
    status: "reexport",
    legacy: ["src/lib/platform/workflow"],
    retirement: "Bridge or freeze B-04 platform/workflow; no new callers",
    notes: "Workflow Studio under workflows/engine is a surface on the same family",
  },
  {
    capability: "decisions",
    canonicalImport: "@/jag/decisions",
    implementation: "src/jag/decisions",
    status: "canonical",
    legacy: ["src/lib/platform/decision"],
    retirement: "Bridge B-05 platform/decision behind DecisionRuntime or freeze",
    notes: "src/lib/platform/decisions is the founder decision QUEUE — different capability",
  },
  {
    capability: "decision-queue",
    canonicalImport: "@/lib/platform/decisions",
    implementation: "src/lib/platform/decisions",
    status: "different-capability",
    notes: "Keep as queue/work product; do not merge into Decision Engine without rename",
  },
  {
    capability: "graph-meta",
    canonicalImport: "@/jag/graph",
    implementation: "src/lib/platform/graph",
    status: "reexport",
    notes: "App/schema/entity registration graph",
  },
  {
    capability: "knowledge-graph",
    canonicalImport: "@/lib/platform/knowledge-graph",
    implementation: "src/lib/platform/knowledge-graph",
    status: "legacy-compat",
    retirement: "Unify under @/jag/graph or @/jag/knowledge-graph in a later wave",
    notes: "Product KG — not deleted; not yet the @/jag barrel owner",
  },
  {
    capability: "processes",
    canonicalImport: "@/jag/processes",
    implementation: "src/jag/processes",
    status: "canonical",
  },
  {
    capability: "navigation",
    canonicalImport: "@/jag/navigation",
    implementation: "src/jag/navigation",
    status: "canonical",
    legacy: ["src/lib/dashboard/navigation#DASHBOARD_MODULES"],
    notes: "Packages contribute defs; dashboard falls back for pre-boot",
  },
  {
    capability: "sdk",
    canonicalImport: "@/jag/sdk",
    implementation: "src/lib/platform/sdk",
    status: "reexport",
  },
  {
    capability: "schema",
    canonicalImport: "@/jag/schema",
    implementation: "src/lib/platform/schema",
    status: "reexport",
  },
  {
    capability: "entities",
    canonicalImport: "@/jag/entities",
    implementation: "src/lib/platform/entities",
    status: "reexport",
  },
  {
    capability: "forms",
    canonicalImport: "@/jag/forms",
    implementation: "src/lib/platform/forms",
    status: "reexport",
  },
  {
    capability: "api",
    canonicalImport: "@/jag/api",
    implementation: "src/lib/platform/api",
    status: "reexport",
  },
  {
    capability: "documents",
    canonicalImport: "@/jag/documents",
    implementation: "src/jag/documents",
    status: "canonical",
    legacy: ["src/lib/documents"],
    retirement: "Bridge lib/documents callers to DocumentRuntime; keep storage adapters separate",
    notes: "Sprint 007 Universal Documents Engine — persistence via ports only",
  },
  {
    capability: "communications",
    canonicalImport: "@/jag/communications",
    implementation: "src/jag/communications",
    status: "canonical",
    legacy: [
      "src/lib/communications",
      "src/lib/platform/notifications",
    ],
    retirement: "Bridge lib/notifications callers to CommunicationRuntime; providers stay adapters",
    notes: "Sprint 008 Universal Communications Engine — delivery via ports only",
  },
  {
    capability: "packages",
    canonicalImport: "@/jag/packages",
    implementation: "src/jag/packages",
    status: "canonical",
    legacy: ["src/jag/runtime/package-loader.ts"],
    retirement:
      "Retire JagPackageHost when packages self-describe discovery without a host binder",
    notes:
      "Sprint 009 runtime + Sprint 010 Academy host via PackageLoader; runtime stays package-agnostic",
  },

  {
    capability: "organizations",
    canonicalImport: "@/lib/platform/organizations",
    implementation: "src/lib/platform/organizations",
    status: "legacy-compat",
    legacy: [
      "src/lib/platform/organization-platform",
      "src/lib/platform/jag-organization",
    ],
    retirement: "Consolidate to one org model under @/jag/organizations",
    notes: "Universal org ownership — not Academy package",
  },
] as const satisfies readonly CanonicalOwnerRecord[];

export type CanonicalCapability =
  (typeof JAG_CANONICAL_OWNERS)[number]["capability"];

export function getCanonicalOwner(
  capability: string
): CanonicalOwnerRecord | undefined {
  return JAG_CANONICAL_OWNERS.find((o) => o.capability === capability);
}

/** Capabilities that must not gain a second engine implementation. */
export const CANONICAL_ENGINE_CAPABILITIES = [
  "workflows",
  "decisions",
  "processes",
  "documents",
  "communications",
  "entities",
  "forms",
  "schema",
  "sdk",
  "api",
  "navigation",
  "runtime",
  "packages",
] as const;
