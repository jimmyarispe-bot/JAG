import { bootstrapDigitalTwin } from "@/lib/digital-twin/bootstrap";
import { createTwinMetricsService } from "@/lib/digital-twin/metrics";
import { createTwinRegistry } from "@/lib/digital-twin/registry";
import { createTwinRelationshipService } from "@/lib/digital-twin/relationships";
import type { TwinExplorerView } from "@/lib/digital-twin/types";

export function buildTwinExplorerView(input: {
  organizationId: string;
  organizationName: string;
  actor?: string;
}): TwinExplorerView {
  bootstrapDigitalTwin(input);
  const registry = createTwinRegistry();
  const relationships = createTwinRelationshipService();
  const metrics = createTwinMetricsService().snapshot(input.organizationId);

  const all = registry.list(input.organizationId, { status: "Active" });
  return {
    organizations: Object.freeze(
      all.filter((e) => e.entityType === "Organization")
    ),
    people: Object.freeze(all.filter((e) => e.entityType === "Person")),
    teams: Object.freeze(all.filter((e) => e.entityType === "Team")),
    assets: Object.freeze(all.filter((e) => e.entityType === "Asset")),
    decisions: Object.freeze(all.filter((e) => e.entityType === "Decision")),
    documents: Object.freeze(all.filter((e) => e.entityType === "Document")),
    products: Object.freeze(
      all.filter((e) => e.entityType === "Product / Service")
    ),
    relationships: relationships.list(input.organizationId),
    metrics,
  };
}
