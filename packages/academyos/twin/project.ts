/**
 * Project AcademyOS entities into the Canonical Digital Twin™.
 */

import { createTwinRegistry } from "@/lib/digital-twin";
import { createTwinRelationshipService } from "@/lib/digital-twin";
import type { TwinEntityType } from "@/lib/digital-twin";
import { twinExternalKey } from "../twin/mappings";

export type ProjectAcademyEntityInput = {
  organizationId: string;
  academyEntity: string;
  twinEntityType: TwinEntityType;
  id: string;
  label: string;
  description?: string;
  kind: string;
  actor: string;
  metadata?: Record<string, string>;
};

export function projectAcademyEntityToTwin(
  input: ProjectAcademyEntityInput
): string | null {
  const registry = createTwinRegistry();
  const result = registry.register({
    organizationId: input.organizationId,
    entityType: input.twinEntityType,
    label: input.label,
    description: input.description ?? "",
    externalKey: twinExternalKey(input.academyEntity, input.id),
    metadata: {
      academyosKind: input.kind,
      academyosEntity: input.academyEntity,
      academyosId: input.id,
      pack: "academyos",
      ...(input.metadata ?? {}),
    },
    createdBy: input.actor,
  });
  if ("error" in result) return null;
  return result.id;
}

export function linkAcademyEnrollment(input: {
  organizationId: string;
  studentTwinId: string;
  courseTwinId: string;
  actor: string;
}): boolean {
  const relationships = createTwinRelationshipService();
  const rel = relationships.connect({
    organizationId: input.organizationId,
    fromTwinId: input.studentTwinId,
    toTwinId: input.courseTwinId,
    relationshipType: "participates_in",
    actor: input.actor,
  });
  return !("error" in rel);
}
