import type { RuntimeSpecification } from "@/jag/blueprints/contracts";

export function runtimeSpecificationIds(spec: RuntimeSpecification): {
  entities: string[];
  processes: string[];
  decisions: string[];
  documents: string[];
  communications: string[];
  permissions: string[];
  reports: string[];
} {
  return {
    entities: (spec.entities ?? []).map((e) => e.entityType).sort(),
    processes: (spec.processes ?? []).map((p) => p.id).sort(),
    decisions: (spec.decisions ?? []).map((d) => d.id).sort(),
    documents: (spec.documents?.definitions ?? []).map((d) => d.id).sort(),
    communications: (spec.communications?.definitions ?? [])
      .map((c) => c.id)
      .sort(),
    permissions: (spec.permissions ?? []).map((p) => p.id).sort(),
    reports: (spec.reports ?? []).map((r) => r.id).sort(),
  };
}
